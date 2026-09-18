import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 预设杨林本地经典求职人才库 (职教园区毕业生、本地技工、餐饮、财务、销售等)
const DEFAULT_RESUMES = [
  {
    name: "李晓敏",
    gender: "female",
    birthYear: 2001,
    education: "本科",
    experience: "1-3年",
    targetJob: "行政前台 / 人事专员",
    targetSalary: "3500-4500元/月",
    targetArea: "杨林职教园区 / 领东国际",
    jobStatus: "LOOKING",
    skills: "熟练使用Office办公软件、普通话一级乙等、人力资源三级证书",
    intro: "毕业于云南大学滇池学院，有2年园区企业人事招聘及行政后勤工作经验。沟通能力强，踏实细心，随时可到岗。",
    phone: "13888921045",
    wechat: "lxm_yanglin",
    status: "APPROVED",
    isTop: true,
  },
  {
    name: "张建国",
    gender: "male",
    birthYear: 1993,
    education: "大专",
    experience: "5-10年",
    targetJob: "数控车工 / 车间带班组长",
    targetSalary: "6000-8000元/月",
    targetArea: "杨林工业园区",
    jobStatus: "OPEN",
    skills: "持有高级钳工证、电工特种作业操作证、熟练操作广数/西门子系统",
    intro: "在杨林工业园大型机械加工厂工作7年，熟悉各类数控机床调试与批量生产管理，具备班组带队能力。",
    phone: "15912558831",
    wechat: "zjg_cnc",
    status: "APPROVED",
    isTop: true,
  },
  {
    name: "杨雪婷",
    gender: "female",
    birthYear: 1998,
    education: "本科",
    experience: "3-5年",
    targetJob: "财务会计 / 出纳",
    targetSalary: "4000-5500元/月",
    targetArea: "杨林镇区 / 大学城商业街",
    jobStatus: "LOOKING",
    skills: "持有初级会计师职称、用友/金蝶财务软件精通、税务申报熟练",
    intro: "有3年商贸及餐饮连锁企业全盘账务处理与税务申报经验，严谨细致，有责任心。",
    phone: "13629617482",
    wechat: "yangxt_caiwu",
    status: "APPROVED",
    isTop: false,
  },
  {
    name: "王志强",
    gender: "male",
    birthYear: 1990,
    education: "高中/中专",
    experience: "10年以上",
    targetJob: "中餐厨师 / 餐饮主管",
    targetSalary: "5500-7500元/月",
    targetArea: "杨林大学城 / 美食街",
    jobStatus: "LOOKING",
    skills: "擅长滇味特色菜、烧烤炒菜、厨房成本核算与人员管理",
    intro: "从事餐饮行业12年，曾在大学城多家大型餐厅担任主厨，菜品稳定出餐快，懂得厨房卫生安全规范。",
    phone: "18288673914",
    wechat: "chef_wang_yl",
    status: "APPROVED",
    isTop: false,
  },
  {
    name: "陈思宇",
    gender: "male",
    birthYear: 2002,
    education: "大专",
    experience: "应届生",
    targetJob: "新媒体运营 / 短视频剪辑",
    targetSalary: "3000-4500元/月",
    targetArea: "杨林职教园区",
    jobStatus: "LOOKING",
    skills: "精通剪映/PR、擅长抖音同城号拍摄运营、文案策划",
    intro: "杨林职教园区应届毕业生，在校期间运营同城校园抖音账号涨粉2万+，熟悉本地热点网感好。",
    phone: "13577098231",
    wechat: "csy_media",
    status: "APPROVED",
    isTop: false,
  },
  {
    name: "赵磊",
    gender: "male",
    birthYear: 1996,
    education: "大专",
    experience: "3-5年",
    targetJob: "房产销售主管 / 渠道拓展",
    targetSalary: "5000-10000元/月",
    targetArea: "杨林及嵩明各楼盘",
    jobStatus: "LOOKING",
    skills: "具有C1驾照、自带客源与中介渠道资源、善于商务谈判",
    intro: "熟悉杨林及嵩明片区各住宅与商铺项目，带看成交率高，能抗压有进取心。",
    phone: "18788419205",
    wechat: "zhaolei_house",
    status: "APPROVED",
    isTop: false,
  },
];

/** 初始化默认简历库(幂等) */
async function seedDefaultResumes() {
  const count = await prisma.resume.count();
  if (count > 0) return;

  for (const item of DEFAULT_RESUMES) {
    await prisma.resume.create({
      data: item as any,
    });
  }
}

/** GET /api/admin/resumes — 获取人才简历列表 */
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await seedDefaultResumes();

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const education = searchParams.get("education") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));

  const where: Record<string, any> = {};
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (education && education !== "ALL") {
    where.education = education;
  }
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { targetJob: { contains: keyword } },
      { phone: { contains: keyword } },
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

/** PATCH /api/admin/resumes — 修改简历状态/置顶/信息 */
export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session || (session.role !== "ADMIN" && session.role !== "EDITOR")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: "缺少简历 ID" }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.isTop !== undefined) updateData.isTop = Boolean(body.isTop);
  if (body.name !== undefined) updateData.name = body.name;
  if (body.targetJob !== undefined) updateData.targetJob = body.targetJob;
  if (body.targetSalary !== undefined) updateData.targetSalary = body.targetSalary;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.intro !== undefined) updateData.intro = body.intro;
  if (body.jobStatus !== undefined) updateData.jobStatus = body.jobStatus;

  const updated = await prisma.resume.update({
    where: { id: body.id },
    data: updateData,
  });

  return NextResponse.json({ ok: true, resume: updated });
}

/** DELETE /api/admin/resumes — 删除简历 */
export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "仅管理员可删除简历" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: "缺少简历 ID" }, { status: 400 });
  }

  await prisma.resume.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
