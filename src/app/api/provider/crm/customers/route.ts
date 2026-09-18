import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProviderCrmData } from "@/lib/crm-engine";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adminProviderId = searchParams.get("providerId");

    let targetProviderId: string | null = null;

    if (["ADMIN", "EDITOR"].includes(String(session.role || "").toUpperCase()) && adminProviderId) {
      targetProviderId = adminProviderId;
    } else {
      const provider = await prisma.serviceProvider.findUnique({
        where: { userId: session.id },
        select: { id: true, verificationStatus: true },
      });

      if (!provider) {
        return NextResponse.json({ error: "您尚未认证为服务商" }, { status: 403 });
      }
      targetProviderId = provider.id;
    }

    // 调用 CRM 聚合并严格租户隔离
    const crmData = await getProviderCrmData(targetProviderId);

    return NextResponse.json({
      success: true,
      data: crmData,
    });
  } catch (err: any) {
    console.error("GET /api/provider/crm/customers error:", err);
    return NextResponse.json({ error: err.message || "获取客户数据失败" }, { status: 500 });
  }
}
