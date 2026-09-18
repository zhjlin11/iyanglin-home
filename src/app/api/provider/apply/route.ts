import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.id },
    });

    return NextResponse.json({
      success: true,
      provider,
    });
  } catch (error: any) {
    console.error("[API /api/provider/apply GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取认证信息失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "请先登录后提交认证" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      avatar,
      serviceCategory,
      serviceAreas = [],
      phone,
      wechat,
      yearsOfService,
      address,
      intro,
      licenseImages = [],
      verificationType = "SERVICE_VERIFIED",
    } = body;

    if (!name?.trim() || !serviceCategory?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, error: "请完善服务者姓名/店铺名、主营类别和联系电话" },
        { status: 400 }
      );
    }

    const provider = await prisma.serviceProvider.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        name: name.trim(),
        avatar: avatar || null,
        serviceCategory: serviceCategory.trim(),
        serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [serviceAreas].filter(Boolean),
        phone: phone.trim(),
        wechat: wechat?.trim() || null,
        yearsOfService: yearsOfService?.trim() || null,
        address: address?.trim() || null,
        intro: intro?.trim() || "优质本地服务者，秉承诚信、专业、高效的经营理念为街坊服务。",
        licenseImages: Array.isArray(licenseImages) ? licenseImages : [],
        verificationType,
        verificationStatus: "PENDING",
      },
      update: {
        name: name.trim(),
        avatar: avatar || null,
        serviceCategory: serviceCategory.trim(),
        serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [serviceAreas].filter(Boolean),
        phone: phone.trim(),
        wechat: wechat?.trim() || null,
        yearsOfService: yearsOfService?.trim() || null,
        address: address?.trim() || null,
        intro: intro?.trim() || "优质本地服务者，秉承诚信、专业、高效的经营理念为街坊服务。",
        licenseImages: Array.isArray(licenseImages) ? licenseImages : [],
        verificationType,
        verificationStatus: "PENDING", // 重新提交进入待审
        rejectReason: null,
      },
    });

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        action: "PROVIDER_APPLY_SUBMITTED",
        targetId: provider.id,
        userId: session.id,
        metadata: {
          name: provider.name,
          serviceCategory: provider.serviceCategory,
          verificationType: provider.verificationType,
        },
      },
    });

    return NextResponse.json({
      success: true,
      provider,
      message: "认证资料已提交，平台专员将在1个工作日内完成审核！",
    });
  } catch (error: any) {
    console.error("[API /api/provider/apply POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "提交认证申请失败" },
      { status: 500 }
    );
  }
}
