import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CompanyDetailClient, { CompanyDetailData } from "./CompanyDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      name: true,
      shortName: true,
      industry: true,
      address: true,
      district: true,
      city: true,
      description: true,
      logo: true,
      _count: {
        select: { jobs: { where: { status: "APPROVED" } } },
      },
    },
  });

  if (!company) {
    return {
      title: "企业信息不存在或已下架 - 杨林生活网",
      description: "您访问的企业招聘主页不存在或已被平台下架，请返回招聘大厅查看更多在招企业。",
    };
  }

  const jobCount = company._count.jobs;
  const title = `${company.name}招聘_在招职位_杨林生活网`;
  const description = `${company.name}位于${company.address || "云南省昆明市嵩明县杨林经开区"}，主营${company.industry || "实体制造"}，当前共有${jobCount}个在招职位。欢迎查看最新用工岗位、薪资待遇与工作环境。`;

  return {
    title,
    description,
    keywords: [
      company.name,
      company.shortName || "",
      company.industry || "",
      "嵩明招聘",
      "杨林经开区招聘",
      "杨林生活网",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://iyanglin.com/company/${id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: company.logo || "https://iyanglin.com/share/v2/job.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/company/${id}`,
    },
  };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [company, session] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        jobs: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            salary: true,
            area: true,
            jobType: true,
            body: true,
            createdAt: true,
            isTop: true,
          },
        },
      },
    }),
    getSession(),
  ]);

  if (!company || company.status === "ARCHIVED") {
    notFound();
  }

  // 校验当前访问用户是否为该企业的 Organization 成员
  let isCompanyMember = false;
  if (session?.id && company.organizationId) {
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: company.organizationId,
        userId: session.id,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    isCompanyMember = !!member;
  }

  // 数据序列化传给 Client Component
  const clientData: CompanyDetailData = {
    id: company.id,
    name: company.name,
    shortName: company.shortName,
    logo: company.logo,
    coverImage: company.coverImage,
    description: company.description,
    shortDescription: company.shortName,
    industry: company.industry,
    companySize: company.companySize,
    companyType: company.companyType,
    foundedYear: company.foundedYear,
    registeredCapital: company.registeredCapital,
    province: company.province,
    city: company.city,
    district: company.district,
    address: company.address,
    isVerified: company.isVerified,
    verificationStatus: company.verificationStatus,
    isFeaturedEmployer: company.isFeaturedEmployer,
    isCompanyMember,
    jobs: company.jobs.map((j) => ({
      id: j.id,
      title: j.title,
      salary: j.salary,
      area: j.area,
      jobType: j.jobType,
      body: j.body,
      createdAt: j.createdAt.toISOString(),
      isTop: j.isTop,
    })),
  };

  return (
    <main className="min-h-screen bg-[#F6F8FB]">
      <Navbar />
      <CompanyDetailClient company={clientData} />
    </main>
  );
}
