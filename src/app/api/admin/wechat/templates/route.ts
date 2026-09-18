import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWechatAccessToken } from "@/lib/wechat-service";

/**
 * GET /api/admin/wechat/templates
 * 获取通知模板列表（本地 + 微信端）
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const syncRemote = searchParams.get("sync") === "1";

    // 本地模板列表
    const localTemplates = await prisma.wechatNotificationTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    let remoteTemplates: any[] = [];

    // 可选：从微信API同步模板列表
    if (syncRemote) {
      try {
        const token = await getWechatAccessToken();
        const res = await fetch(
          `https://api.weixin.qq.com/cgi-bin/template/get_all_private_template?access_token=${token}`
        );
        const data = await res.json();
        if (data.template_list) {
          remoteTemplates = data.template_list;
        }
      } catch (err: any) {
        // 不影响主流程
        console.error("[Templates] Sync remote error:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        local: localTemplates,
        remote: remoteTemplates,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}

/**
 * POST /api/admin/wechat/templates
 * 保存/更新本地模板配置
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, templateId, name, scene, contentMap, jumpUrl, description, enabled } = body;

    if (!scene?.trim() || !name?.trim()) {
      return NextResponse.json({ error: "场景标识和名称不能为空" }, { status: 400 });
    }

    // Upsert by scene (unique key)
    const template = await prisma.wechatNotificationTemplate.upsert({
      where: { scene: scene.trim() },
      update: {
        name: name.trim(),
        templateId: templateId || null,
        contentMap: contentMap || null,
        jumpUrl: jumpUrl || null,
        description: description || null,
        enabled: enabled !== false,
      },
      create: {
        scene: scene.trim(),
        name: name.trim(),
        templateId: templateId || null,
        contentMap: contentMap || null,
        jumpUrl: jumpUrl || null,
        description: description || null,
        enabled: enabled !== false,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "保存失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/wechat/templates
 * 删除本地模板配置
 */
export async function DELETE(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

    await prisma.wechatNotificationTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "已删除" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
