import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTempQrCode } from "@/lib/wechat-service";
import { getWechatAccessToken } from "@/lib/wechat-service";

/**
 * GET /api/admin/wechat/qrcodes
 * 获取渠道二维码列表
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const qrcodes = await prisma.wechatQrCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: qrcodes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/wechat/qrcodes
 * 创建渠道二维码
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, scene, type, welcomeMsg, autoTagIds, targetType, targetValue } = body;

    if (!name?.trim() || !scene?.trim()) {
      return NextResponse.json({ error: "名称和场景值不能为空" }, { status: 400 });
    }

    // 检查场景值唯一性
    const existing = await prisma.wechatQrCode.findUnique({ where: { scene: scene.trim() } });
    if (existing) {
      return NextResponse.json({ error: `场景值"${scene}"已存在` }, { status: 400 });
    }

    // 调用微信接口生成二维码
    let wechatTicket: string | null = null;
    let qrUrl: string | null = null;
    let expireAt: Date | null = null;

    try {
      const token = await getWechatAccessToken();
      const isPerm = type === "PERM";

      const apiUrl = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${token}`;
      const payload = isPerm
        ? {
            action_name: "QR_LIMIT_STR_SCENE",
            action_info: { scene: { scene_str: scene.trim() } },
          }
        : {
            expire_seconds: 2592000, // 30天
            action_name: "QR_STR_SCENE",
            action_info: { scene: { scene_str: scene.trim() } },
          };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.errcode) {
        return NextResponse.json({
          error: `微信接口错误: [${data.errcode}] ${data.errmsg}`,
        }, { status: 400 });
      }

      wechatTicket = data.ticket || null;
      qrUrl = wechatTicket
        ? `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(wechatTicket)}`
        : null;

      if (!isPerm && data.expire_seconds) {
        expireAt = new Date(Date.now() + data.expire_seconds * 1000);
      }
    } catch (err: any) {
      return NextResponse.json({
        error: `创建微信二维码失败: ${err.message}`,
      }, { status: 500 });
    }

    const qrCode = await prisma.wechatQrCode.create({
      data: {
        name: name.trim(),
        scene: scene.trim(),
        type: type === "PERM" ? "PERM" : "TEMP",
        expireAt,
        wechatTicket,
        qrUrl,
        targetType: targetType || "WELCOME",
        targetValue: targetValue || null,
        welcomeMsg: welcomeMsg || null,
        autoTagIds: autoTagIds || [],
        enabled: true,
        createdBy: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "渠道二维码创建成功",
      data: qrCode,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "创建失败" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/wechat/qrcodes
 * 更新渠道二维码（只更新本地配置，不重新生成微信二维码）
 */
export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, welcomeMsg, autoTagIds, targetType, targetValue, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    const updated = await prisma.wechatQrCode.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(welcomeMsg !== undefined ? { welcomeMsg } : {}),
        ...(autoTagIds !== undefined ? { autoTagIds } : {}),
        ...(targetType !== undefined ? { targetType } : {}),
        ...(targetValue !== undefined ? { targetValue } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/wechat/qrcodes
 * 删除渠道二维码
 */
export async function DELETE(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    await prisma.wechatQrCode.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
