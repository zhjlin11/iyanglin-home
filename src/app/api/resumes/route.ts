import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** GET /api/resumes — 前台获取公开求职人才列表 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const education = searchParams.get("education") || "";
  const experience = searchParams.get("experience") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "15"));

  const where: Record<string, any> = {
    status: "APPROVED",
  };

  if (education && education !== "ALL") {
    where.education = education;
  }
  if (experience && experience !== "ALL") {
    where.experience = experience;
  }
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { targetJob: { contains: keyword } },
      { skills: { contains: keyword } },
      { intro: { contains: keyword } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.resume.count({ where }),
    prisma.resume.findMany({
      where,
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    resumes: items,
  });
}

/** POST /api/resumes — 求职者发布/创建个人求职简历 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再创建简历" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.targetJob || !body.phone) {
    return NextResponse.json({ error: "姓名、期望职位与联系电话为必填项" }, { status: 400 });
  }

  const resume = await prisma.resume.create({
    data: {
      name: String(body.name),
      gender: body.gender || "male",
      birthYear: parseInt(body.birthYear) || 1998,
      education: body.education || "大专",
      experience: body.experience || "1-3年",
      targetJob: String(body.targetJob),
      targetSalary: body.targetSalary || "面议",
      targetArea: body.targetArea || "杨林职教园区",
      jobStatus: body.jobStatus || "LOOKING",
      skills: body.skills || "",
      intro: body.intro || "暂无自我评价",
      phone: String(body.phone),
      wechat: body.wechat || "",
      avatar: body.avatar || "",
      authorId: session.id,
      status: "APPROVED",
    },
  });

  return NextResponse.json({ ok: true, resume });
}
