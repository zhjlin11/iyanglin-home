import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const records = await prisma.verificationRecord.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "获取认证记录失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      verifyType,
      idCardName,
      idCardNoMasked,
      idCardPhotos = [],
      companyName,
      licenseNo,
      licensePhotos = [],
    } = body;

    const allowedTypes = [
      "REAL_NAME",
      "ENTERPRISE",
      "MERCHANT",
      "PROVIDER",
      "LANDLORD",
    ];
    if (!verifyType || !allowedTypes.includes(verifyType)) {
      return NextResponse.json({ error: "无效的认证类型" }, { status: 400 });
    }

    if (verifyType === "REAL_NAME" && !idCardName) {
      return NextResponse.json({ error: "请填写真实姓名" }, { status: 400 });
    }

    if (
      (verifyType === "ENTERPRISE" || verifyType === "MERCHANT") &&
      !companyName
    ) {
      return NextResponse.json({ error: "请填写企业或店铺名称" }, { status: 400 });
    }

    // 检查是否有待审核的同类型申请
    const existingPending = await prisma.verificationRecord.findFirst({
      where: {
        userId: session.id,
        verifyType,
        status: "PENDING",
      },
    });
    if (existingPending) {
      return NextResponse.json(
        { error: "您已有一笔同类型认证申请正在审核中，请耐心等待管理员处理" },
        { status: 400 }
      );
    }

    // 创建认证记录
    const record = await prisma.verificationRecord.create({
      data: {
        userId: session.id,
        verifyType,
        idCardName: idCardName ? String(idCardName).trim() : null,
        idCardNoMasked: idCardNoMasked ? String(idCardNoMasked).trim() : null,
        idCardPhotos: Array.isArray(idCardPhotos) ? idCardPhotos : [],
        companyName: companyName ? String(companyName).trim() : null,
        licenseNo: licenseNo ? String(licenseNo).trim() : null,
        licensePhotos: Array.isArray(licensePhotos) ? licensePhotos : [],
        status: "PENDING",
      },
    });

    // 系统通知提醒
    const typeNames: Record<string, string> = {
      REAL_NAME: "实名身份认证",
      ENTERPRISE: "企业雇主认证",
      MERCHANT: "本地商户入驻认证",
      PROVIDER: "专业服务者/师傅认证",
      LANDLORD: "真实房东认证",
    };

    await prisma.notification.create({
      data: {
        userId: session.id,
        category: "SYSTEM",
        type: "SYSTEM_NOTICE",
        title: `📑 ${typeNames[verifyType] || "认证"}申请已提交`,
        content: `您的「${typeNames[verifyType] || "认证"}」申请已成功提交至平台审核中心，工作人员将在 1~2 个工作日内完成核验。`,
        link: "/profile?tab=verification",
      },
    });

    return NextResponse.json({
      success: true,
      message: "认证申请提交成功，请等待人工审核",
      record,
    });
  } catch (err: any) {
    console.error("[Verification POST] error:", err);
    return NextResponse.json(
      { error: err.message || "提交认证申请失败" },
      { status: 500 }
    );
  }
}
