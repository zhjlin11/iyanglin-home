import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const search = (req.nextUrl.searchParams.get("q") || "").trim();

  // 1. Fetch organizations where user is an active member
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.id, status: "ACTIVE" },
    include: {
      organization: {
        include: {
          company: true,
        },
      },
    },
  });

  const myCompanies: any[] = [];
  const seenIds = new Set<string>();

  for (const m of memberships) {
    if (m.organization.company) {
      const c = m.organization.company;
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id);
        myCompanies.push({
          id: c.id,
          name: c.name,
          shortName: c.shortName,
          logo: c.logo,
          industry: c.industry,
          address: c.address,
          isVerified: c.isVerified && c.verificationStatus === "VERIFIED",
          role: m.role,
        });
      }
    }
  }

  // 2. If user searched, also search public active companies
  let searchResults: any[] = [];
  if (search) {
    const list = await prisma.company.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { shortName: { contains: search, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        logo: true,
        industry: true,
        address: true,
        isVerified: true,
        verificationStatus: true,
      },
      take: 10,
    });
    searchResults = list.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      logo: c.logo,
      industry: c.industry,
      address: c.address,
      isVerified: c.isVerified && c.verificationStatus === "VERIFIED",
    }));
  }

  return NextResponse.json({
    success: true,
    myCompanies,
    searchResults,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "请填写企业全称" }, { status: 400 });
  }

  // Check duplicate
  const existing = await prisma.company.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json({
      success: true,
      company: existing,
      message: "该企业已在平台收录，已直接为您选中",
    });
  }

  // Create new user-created company
  const company = await prisma.company.create({
    data: {
      name,
      shortName: body.shortName ? String(body.shortName).trim() : (name.length > 8 ? name.slice(0, 6) : name),
      industry: body.industry ? String(body.industry).trim() : "实体制造与商贸",
      address: body.address ? String(body.address).trim() : "云南省昆明市嵩明县杨林经开区",
      contactName: body.contactName ? String(body.contactName).trim() : null,
      contactPhone: body.contactPhone ? String(body.contactPhone).trim() : null,
      description: body.description ? String(body.description).trim() : null,
      isVerified: false,
      verificationStatus: "UNVERIFIED",
      verificationLevel: "基础收录",
      status: "ACTIVE",
      source: "USER_CREATED",
      createdBy: session.id,
    },
  });

  return NextResponse.json({
    success: true,
    company,
  });
}
