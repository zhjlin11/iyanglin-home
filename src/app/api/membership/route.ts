import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listVipPackages,
  getUserMembership,
  grantMembership,
} from "@/lib/membership-store";

/** GET /api/membership — 获取所有可购买的会员等级包以及用户当前生效中的会员状态 */
export async function GET(request: Request) {
  const session = await getSession(request);
  const { searchParams } = new URL(request.url);
  const targetModule = searchParams.get("targetModule") || undefined;

  const packages = await listVipPackages(targetModule);

  let activeMembership = null;
  if (session && targetModule) {
    activeMembership = await getUserMembership(session.id, targetModule);
  }

  return NextResponse.json({
    packages: packages.map((p) => ({
      ...p,
      priceYuan: (p.priceCents / 100).toFixed(2),
    })),
    activeMembership,
  });
}

/** POST /api/membership — 购买/开通会员套餐 */
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.packageId) {
    return NextResponse.json({ error: "缺少 packageId" }, { status: 400 });
  }

  try {
    const membership = await grantMembership(session.id, body.packageId);
    return NextResponse.json({
      ok: true,
      message: "恭喜您，会员开通成功！",
      membership,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "开通失败" }, { status: 400 });
  }
}
