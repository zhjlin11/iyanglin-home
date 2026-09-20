import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createDatingProfile, listDatingProfiles, updateDatingProfile } from "@/lib/love-store";
import { executePublishWithBillingGuard } from "@/lib/billing-guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender") || undefined;
  const status = searchParams.get("status") || undefined;
  const mine = searchParams.get("mine") === "true";
  const search = searchParams.get("q") || undefined;

  let authorId: string | undefined;
  if (mine) {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ items: [] });
    }
    authorId = session.id;
  }

  const items = await listDatingProfiles({ gender, status, authorId, search });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再登记相亲资料" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.nickname || !body.occupation || !body.intro || !body.requirement || !body.contact) {
    return NextResponse.json({ error: "昵称、职业、个人介绍、择偶要求及联系方式不能为空" }, { status: 400 });
  }

  const roleUpper = String(session.role || "").toUpperCase();
  const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR";
  const statusInput = typeof body.status === "string" ? body.status.toLowerCase() : "pending";
  const status = isAdmin ? statusInput : "pending";
  const authorId = session.id;

  const publishResult = await executePublishWithBillingGuard({
    module: "love",
    action: "PUBLISH",
    userId: authorId,
    userRole: session.role,
    entitlementId: body.entitlementId,
    adminBypass: isAdmin,
    createResource: async (tx) => {
      return createDatingProfile(
        {
          gender: typeof body.gender === "string" ? body.gender.trim() : "female",
          nickname: String(body.nickname).trim(),
          birthYear: typeof body.birthYear === "number" ? body.birthYear : parseInt(body.birthYear) || 1995,
          heightCm: typeof body.heightCm === "number" ? body.heightCm : parseInt(body.heightCm) || 165,
          education: typeof body.education === "string" ? body.education.trim() : "本科",
          occupation: String(body.occupation).trim(),
          income: typeof body.income === "string" && body.income.trim() ? body.income.trim() : "5000-8000元/月",
          maritalStatus: typeof body.maritalStatus === "string" ? body.maritalStatus.trim() : "未婚",
          location: typeof body.location === "string" ? body.location.trim() : "杨林本地",
          requirement: String(body.requirement).trim(),
          intro: String(body.intro).trim(),
          contact: String(body.contact).trim(),
          status,
          authorId,
          photos: Array.isArray(body.photos) ? body.photos : [],
        },
        tx
      );
    },
  });

  if (!publishResult.success && publishResult.needPayment) {
    return NextResponse.json(
      {
        success: false,
        code: "NEED_PAYMENT",
        error: publishResult.error,
        quote: publishResult.quote,
      },
      { status: 402 }
    );
  }

  const item = (publishResult as any).item;

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "无管理员权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: "缺少必要字段 id 或 status" }, { status: 400 });
  }

  const item = await updateDatingProfile(body.id, body.status, {
    gender: typeof body.gender === "string" ? body.gender.trim() : undefined,
    nickname: typeof body.nickname === "string" ? body.nickname.trim() : undefined,
    birthYear: typeof body.birthYear === "number" ? body.birthYear : undefined,
    heightCm: typeof body.heightCm === "number" ? body.heightCm : undefined,
    education: typeof body.education === "string" ? body.education.trim() : undefined,
    occupation: typeof body.occupation === "string" ? body.occupation.trim() : undefined,
    income: typeof body.income === "string" ? body.income.trim() : undefined,
    maritalStatus: typeof body.maritalStatus === "string" ? body.maritalStatus.trim() : undefined,
    location: typeof body.location === "string" ? body.location.trim() : undefined,
    requirement: typeof body.requirement === "string" ? body.requirement.trim() : undefined,
    intro: typeof body.intro === "string" ? body.intro.trim() : undefined,
    contact: typeof body.contact === "string" ? body.contact.trim() : undefined,
    photos: Array.isArray(body.photos) ? body.photos : undefined,
  });

  return NextResponse.json({ item });
}
