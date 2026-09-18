import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeCompleteness,
  detectCompanyDuplicates,
  diagnoseCompanyIssues,
} from "@/lib/companyGovernance";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = (searchParams.get("search") || searchParams.get("q") || "").trim();
  const verificationStatus = searchParams.get("verificationStatus") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const isFeatured = searchParams.get("isFeatured");
  const source = searchParams.get("source") || "ALL";
  const industry = searchParams.get("industry") || "ALL";
  const hasJobs = searchParams.get("hasJobs");
  const completenessFilter = searchParams.get("completeness") || "ALL";
  const duplicateFlag = searchParams.get("duplicateFlag") === "true";
  const sortBy = searchParams.get("sortBy") || "updatedAt";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

  // 1. 全局轻量扫描计算大盘统计 & 疑似重复池
  const allCompaniesLight = await prisma.company.findMany({
    where: {
      status: status === "ARCHIVED" ? "ARCHIVED" : { not: "ARCHIVED" },
    },
    select: {
      id: true,
      name: true,
      creditCode: true,
      contactPhone: true,
      address: true,
      logo: true,
      industry: true,
      companySize: true,
      companyType: true,
      description: true,
      businessLicenseImage: true,
      isVerified: true,
      verificationStatus: true,
      isFeaturedEmployer: true,
      status: true,
      _count: { select: { jobs: true } },
    },
  });

  const duplicateMap = detectCompanyDuplicates(allCompaniesLight);

  let verifiedCount = 0;
  let featuredCount = 0;
  let pendingCount = 0;
  let incompleteCount = 0;

  for (const c of allCompaniesLight) {
    if (c.verificationStatus === "VERIFIED") verifiedCount++;
    if (c.isFeaturedEmployer) featuredCount++;
    if (c.verificationStatus === "PENDING") pendingCount++;
    const compScore = computeCompleteness(c).score;
    if (compScore < 80) incompleteCount++;
  }

  const suspectedDuplicateCount = duplicateMap.size;

  // 2. 构造查询条件
  const where: any = {};

  if (status === "ARCHIVED") {
    where.status = "ARCHIVED";
  } else if (status !== "ALL") {
    where.status = status;
  } else {
    where.status = { not: "ARCHIVED" };
  }

  if (verificationStatus !== "ALL") {
    where.verificationStatus = verificationStatus;
  }

  if (isFeatured === "true") where.isFeaturedEmployer = true;
  if (isFeatured === "false") where.isFeaturedEmployer = false;

  if (source !== "ALL") {
    where.source = source;
  }

  if (industry !== "ALL") {
    where.industry = industry;
  }

  if (hasJobs === "true" || hasJobs === "has_jobs") {
    where.jobs = { some: {} };
  } else if (hasJobs === "false" || hasJobs === "no_jobs") {
    where.jobs = { none: {} };
  }

  if (duplicateFlag) {
    const duplicateIds = Array.from(duplicateMap.keys());
    where.id = { in: duplicateIds.length > 0 ? duplicateIds : ["__none__"] };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortName: { contains: search, mode: "insensitive" } },
      { creditCode: { contains: search } },
      { contactPhone: { contains: search } },
      { contactName: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
    ];
  }

  // 3. 排序策略
  let orderBy: any = [{ isVerified: "desc" }, { updatedAt: "desc" }];
  if (sortBy === "jobs_desc") {
    orderBy = [{ jobs: { _count: "desc" } }, { updatedAt: "desc" }];
  } else if (sortBy === "createdAt") {
    orderBy = [{ createdAt: "desc" }];
  } else if (sortBy === "name") {
    orderBy = [{ name: "asc" }];
  }

  // 4. 执行分页检索
  const [total, rawCompanies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, type: true, ownerId: true },
        },
        jobs: {
          select: {
            id: true,
            title: true,
            salary: true,
            status: true,
            updatedAt: true,
          },
          take: 6,
          orderBy: { updatedAt: "desc" },
        },
        _count: {
          select: { jobs: true },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // 5. 组装富含治理信息的数据模型
  const companies = rawCompanies.map((c) => {
    const completeness = computeCompleteness(c);
    const duplicateInfo = duplicateMap.get(c.id) || null;
    const issues = diagnoseCompanyIssues({
      isVerified: c.isVerified,
      verificationStatus: c.verificationStatus,
      businessLicenseImage: c.businessLicenseImage,
      isFeaturedEmployer: c.isFeaturedEmployer,
      jobCount: c._count.jobs,
      status: c.status,
      hasActiveJobs: c.jobs.some((j) => j.status === "APPROVED"),
    });

    return {
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      logo: c.logo,
      coverImage: c.coverImage,
      description: c.description,
      industry: c.industry,
      companySize: c.companySize,
      companyType: c.companyType,
      address: c.address,
      contactName: c.contactName,
      contactPhone: c.contactPhone,
      contactWechat: c.contactWechat,
      creditCode: c.creditCode,
      businessLicenseImage: c.businessLicenseImage,
      legalRepresentative: c.legalRepresentative,
      isVerified: c.isVerified,
      verificationStatus: c.verificationStatus,
      verificationLevel: c.verificationLevel,
      verifiedAt: c.verifiedAt,
      rejectReason: c.rejectReason,
      isFeaturedEmployer: c.isFeaturedEmployer,
      status: c.status,
      source: c.source,
      organizationId: c.organizationId,
      organizationName: c.organization?.name || null,
      jobCount: c._count.jobs,
      recentJobs: c.jobs,
      completeness,
      isSuspectedDuplicate: !!duplicateInfo,
      duplicateInfo,
      issues,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  });

  // 如果按完整度过滤，进行结果后过滤与调整
  let filteredCompanies = companies;
  if (completenessFilter === "complete") {
    filteredCompanies = companies.filter((c) => c.completeness.score >= 80);
  } else if (completenessFilter === "incomplete") {
    filteredCompanies = companies.filter((c) => c.completeness.score >= 40 && c.completeness.score < 80);
  } else if (completenessFilter === "severe") {
    filteredCompanies = companies.filter((c) => c.completeness.score < 40);
  }

  return NextResponse.json({
    success: true,
    total,
    page,
    limit,
    stats: {
      total: allCompaniesLight.length,
      verifiedCount,
      featuredCount,
      pendingCount,
      suspectedDuplicateCount,
      incompleteCount,
    },
    companies: filteredCompanies,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "企业全称不能为空" }, { status: 400 });
  }

  // 查重
  const existing = await prisma.company.findFirst({
    where: { name },
  });

  if (existing) {
    return NextResponse.json({
      success: true,
      message: "该企业名称已存在，已为您直接关联选中",
      company: existing,
      isExisting: true,
    });
  }

  const isVerified = body.isVerified === true;
  const verificationStatus = isVerified ? "VERIFIED" : (body.verificationStatus || "UNVERIFIED");

  const newCompany = await prisma.company.create({
    data: {
      name,
      shortName: body.shortName ? String(body.shortName).trim() : (name.length > 8 ? name.slice(0, 6) : name),
      logo: body.logo || null,
      industry: body.industry ? String(body.industry).trim() : "实体制造与商贸",
      companySize: body.companySize || "1-49人",
      companyType: body.companyType || "民营企业",
      address: body.address ? String(body.address).trim() : "云南省昆明市嵩明县杨林经开区",
      contactName: body.contactName ? String(body.contactName).trim() : null,
      contactPhone: body.contactPhone ? String(body.contactPhone).trim() : null,
      creditCode: body.creditCode ? String(body.creditCode).trim() : null,
      description: body.description ? String(body.description).trim() : null,
      isVerified,
      verificationStatus,
      verificationLevel: isVerified ? "平台人工核验" : "基础收录",
      verifiedAt: isVerified ? new Date() : null,
      isFeaturedEmployer: body.isFeaturedEmployer === true,
      status: "ACTIVE",
      source: "ADMIN_CREATED",
      createdBy: session.id,
    },
  });

  // 审计日志
  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: "COMPANY_CREATE",
      targetId: newCompany.id,
      metadata: {
        companyName: newCompany.name,
        source: "ADMIN_CREATED",
        operator: session.username || session.id,
      },
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    company: newCompany,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, action, verificationStatus, rejectReason, isFeaturedEmployer, status, profile } = body;

  if (!id) {
    return NextResponse.json({ error: "缺少公司标识 id" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "企业主体不存在" }, { status: 404 });
  }

  const updateData: any = {};
  let auditAction = "COMPANY_UPDATE";
  const auditMeta: any = { companyName: company.name, operator: session.username || session.id };

  if (action === "VERIFY") {
    updateData.isVerified = true;
    updateData.verificationStatus = "VERIFIED";
    updateData.verificationLevel = body.verificationLevel || "工商执照核验";
    updateData.verifiedAt = new Date();
    updateData.rejectReason = null;
    auditAction = "COMPANY_VERIFY_APPROVE";
  } else if (action === "REJECT") {
    if (!rejectReason || !String(rejectReason).trim()) {
      return NextResponse.json({ error: "驳回认证资质必须填写具体原因" }, { status: 400 });
    }
    updateData.isVerified = false;
    updateData.verificationStatus = "REJECTED";
    updateData.rejectReason = String(rejectReason).trim();
    auditAction = "COMPANY_VERIFY_REJECT";
    auditMeta.rejectReason = updateData.rejectReason;
  } else if (action === "TOGGLE_FEATURED") {
    updateData.isFeaturedEmployer = !company.isFeaturedEmployer;
    auditAction = updateData.isFeaturedEmployer ? "COMPANY_SET_FEATURED" : "COMPANY_UNSET_FEATURED";
  } else if (action === "UPDATE_PROFILE" && profile) {
    if (profile.name) updateData.name = String(profile.name).trim();
    if (profile.shortName !== undefined) updateData.shortName = profile.shortName ? String(profile.shortName).trim() : null;
    if (profile.logo !== undefined) updateData.logo = profile.logo || null;
    if (profile.industry !== undefined) updateData.industry = profile.industry || null;
    if (profile.companySize !== undefined) updateData.companySize = profile.companySize || null;
    if (profile.companyType !== undefined) updateData.companyType = profile.companyType || null;
    if (profile.address !== undefined) updateData.address = profile.address || null;
    if (profile.contactName !== undefined) updateData.contactName = profile.contactName || null;
    if (profile.contactPhone !== undefined) updateData.contactPhone = profile.contactPhone || null;
    if (profile.contactWechat !== undefined) updateData.contactWechat = profile.contactWechat || null;
    if (profile.creditCode !== undefined) updateData.creditCode = profile.creditCode || null;
    if (profile.description !== undefined) updateData.description = profile.description || null;
    if (profile.businessLicenseImage !== undefined) updateData.businessLicenseImage = profile.businessLicenseImage || null;
    if (profile.legalRepresentative !== undefined) updateData.legalRepresentative = profile.legalRepresentative || null;
    auditAction = "COMPANY_UPDATE_PROFILE";
  } else {
    if (verificationStatus !== undefined) {
      updateData.verificationStatus = verificationStatus;
      updateData.isVerified = verificationStatus === "VERIFIED";
      if (verificationStatus === "VERIFIED") updateData.verifiedAt = new Date();
    }
    if (rejectReason !== undefined) updateData.rejectReason = rejectReason;
    if (isFeaturedEmployer !== undefined) updateData.isFeaturedEmployer = !!isFeaturedEmployer;
    if (status !== undefined) updateData.status = status;
  }

  const updated = await prisma.company.update({
    where: { id },
    data: updateData,
  });

  // 记录审计日志
  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: auditAction,
      targetId: id,
      metadata: { ...auditMeta, changes: Object.keys(updateData) },
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, company: updated });
}
