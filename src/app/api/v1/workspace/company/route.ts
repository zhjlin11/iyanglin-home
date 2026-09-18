import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { verifyOrgAccess, logOrgAudit } from "@/lib/organization-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "缺少组织ID" }, { status: 400 });
  }

  const access = await verifyOrgAccess(session.id, organizationId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error || "无权访问该组织" }, { status: 403 });
  }

  let company = await prisma.company.findUnique({
    where: { organizationId },
    include: {
      _count: {
        select: { jobs: true },
      },
    },
  });

  // If no direct link, try to find existing company with the same name that is unlinked
  if (!company && access.organization?.name) {
    const existingSameName = await prisma.company.findUnique({
      where: { name: access.organization.name },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    if (existingSameName && !existingSameName.organizationId) {
      // Auto-bind to this organization
      company = await prisma.company.update({
        where: { id: existingSameName.id },
        data: { organizationId },
        include: {
          _count: {
            select: { jobs: true },
          },
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    company: company || null,
    organization: access.organization,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      organizationId,
      name,
      shortName,
      logo,
      coverImage,
      description,
      industry,
      companySize,
      companyType,
      foundedYear,
      registeredCapital,
      creditCode,
      businessLicenseImage,
      legalRepresentative,
      contactName,
      contactPhone,
      contactWechat,
      email,
      website,
      address,
      submitVerification,
    } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "缺少组织ID" }, { status: 400 });
    }

    const access = await verifyOrgAccess(session.id, organizationId, "jobs:write");
    if (!access.authorized) {
      return NextResponse.json({ error: access.error || "无操作权限" }, { status: 403 });
    }

    const existingByOrg = await prisma.company.findUnique({
      where: { organizationId },
    });

    const parsedFoundedYear = foundedYear ? parseInt(String(foundedYear), 10) : undefined;

    let targetCompany: any = null;

    if (existingByOrg) {
      // Update existing
      const updateData: any = {
        shortName: shortName !== undefined ? shortName?.trim() || null : undefined,
        logo: logo !== undefined ? logo?.trim() || null : undefined,
        coverImage: coverImage !== undefined ? coverImage?.trim() || null : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        industry: industry !== undefined ? industry?.trim() || null : undefined,
        companySize: companySize !== undefined ? companySize?.trim() || null : undefined,
        companyType: companyType !== undefined ? companyType?.trim() || null : undefined,
        foundedYear: isNaN(parsedFoundedYear as number) ? null : parsedFoundedYear,
        registeredCapital: registeredCapital !== undefined ? registeredCapital?.trim() || null : undefined,
        legalRepresentative: legalRepresentative !== undefined ? legalRepresentative?.trim() || null : undefined,
        contactName: contactName !== undefined ? contactName?.trim() || null : undefined,
        contactPhone: contactPhone !== undefined ? contactPhone?.trim() || null : undefined,
        contactWechat: contactWechat !== undefined ? contactWechat?.trim() || null : undefined,
        email: email !== undefined ? email?.trim() || null : undefined,
        website: website !== undefined ? website?.trim() || null : undefined,
        address: address !== undefined ? address?.trim() || null : undefined,
      };

      if (creditCode !== undefined) {
        updateData.creditCode = creditCode?.trim() || null;
      }
      if (businessLicenseImage !== undefined) {
        updateData.businessLicenseImage = businessLicenseImage?.trim() || null;
      }

      // If submitVerification is true or business license is provided and current status is UNVERIFIED/REJECTED
      if (submitVerification || (businessLicenseImage && (existingByOrg.verificationStatus === "UNVERIFIED" || existingByOrg.verificationStatus === "REJECTED"))) {
        updateData.verificationStatus = "PENDING";
        updateData.rejectReason = null;
      }

      targetCompany = await prisma.company.update({
        where: { id: existingByOrg.id },
        data: updateData,
      });
    } else {
      // Needs to create or bind
      const companyName = (name || access.organization?.name || "").trim();
      if (!companyName) {
        return NextResponse.json({ error: "公司名称不能为空" }, { status: 400 });
      }

      // Check if company exists with this name
      const existingByName = await prisma.company.findUnique({
        where: { name: companyName },
      });

      if (existingByName) {
        if (existingByName.organizationId && existingByName.organizationId !== organizationId) {
          return NextResponse.json(
            { error: `公司名称 "${companyName}" 已被其他组织绑定，若需申诉请联系平台客服` },
            { status: 400 }
          );
        }

        // Bind existing company to this organization
        targetCompany = await prisma.company.update({
          where: { id: existingByName.id },
          data: {
            organizationId,
            shortName: shortName?.trim() || existingByName.shortName,
            logo: logo?.trim() || existingByName.logo,
            description: description?.trim() || existingByName.description,
            industry: industry?.trim() || existingByName.industry,
            companySize: companySize?.trim() || existingByName.companySize,
            creditCode: creditCode?.trim() || existingByName.creditCode,
            businessLicenseImage: businessLicenseImage?.trim() || existingByName.businessLicenseImage,
            address: address?.trim() || existingByName.address,
            verificationStatus: submitVerification ? "PENDING" : existingByName.verificationStatus,
          },
        });
      } else {
        // Create new company
        targetCompany = await prisma.company.create({
          data: {
            name: companyName,
            shortName: shortName?.trim() || null,
            logo: logo?.trim() || null,
            coverImage: coverImage?.trim() || null,
            description: description?.trim() || null,
            industry: industry?.trim() || "工业制造",
            companySize: companySize?.trim() || "1-49人",
            companyType: companyType?.trim() || "民营企业",
            foundedYear: isNaN(parsedFoundedYear as number) ? null : parsedFoundedYear,
            registeredCapital: registeredCapital?.trim() || null,
            creditCode: creditCode?.trim() || null,
            businessLicenseImage: businessLicenseImage?.trim() || null,
            legalRepresentative: legalRepresentative?.trim() || null,
            contactName: contactName?.trim() || null,
            contactPhone: contactPhone?.trim() || null,
            contactWechat: contactWechat?.trim() || null,
            email: email?.trim() || null,
            website: website?.trim() || null,
            address: address?.trim() || null,
            isVerified: false,
            verificationStatus: submitVerification ? "PENDING" : "UNVERIFIED",
            source: "USER_CREATED",
            createdBy: session.id,
            organizationId,
          },
        });
      }
    }

    // Sync organization logo and name if changed
    if (logo && access.organization && access.organization.logo !== logo) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { logo },
      });
    }

    await logOrgAudit({
      organizationId,
      operatorId: session.id,
      operatorName: session.username || "企业成员",
      action: "UPDATE_COMPANY_PROFILE",
      targetType: "Company",
      targetId: targetCompany.id,
      details: {
        name: targetCompany.name,
        verificationStatus: targetCompany.verificationStatus,
      },
    });

    return NextResponse.json({
      success: true,
      company: targetCompany,
    });
  } catch (err: any) {
    console.error("[WORKSPACE_COMPANY_API_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "更新企业信息失败" },
      { status: 500 }
    );
  }
}
