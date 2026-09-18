import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getWechatMenu,
  createWechatMenu,
  deleteWechatMenu,
  type WechatMenu,
} from "@/lib/wechat-service";

/**
 * GET /api/admin/wechat/menu
 * 获取公众号当前自定义菜单
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const menu = await getWechatMenu();
    return NextResponse.json({ success: true, data: menu });
  } catch (err: any) {
    console.error("[WeChat Menu] GET error:", err);
    return NextResponse.json(
      { error: err.message || "获取菜单失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/wechat/menu
 * 创建/更新公众号自定义菜单
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as WechatMenu;

    if (!body.button || !Array.isArray(body.button)) {
      return NextResponse.json(
        { error: "菜单格式错误，缺少 button 数组" },
        { status: 400 }
      );
    }

    if (body.button.length > 3) {
      return NextResponse.json(
        { error: "一级菜单最多3个" },
        { status: 400 }
      );
    }

    await createWechatMenu(body);
    return NextResponse.json({
      success: true,
      message: "菜单已同步至微信，24小时内对所有用户生效",
    });
  } catch (err: any) {
    console.error("[WeChat Menu] POST error:", err);
    return NextResponse.json(
      { error: err.message || "创建菜单失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/wechat/menu
 * 删除公众号自定义菜单
 */
export async function DELETE(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    await deleteWechatMenu();
    return NextResponse.json({
      success: true,
      message: "菜单已删除",
    });
  } catch (err: any) {
    console.error("[WeChat Menu] DELETE error:", err);
    return NextResponse.json(
      { error: err.message || "删除菜单失败" },
      { status: 500 }
    );
  }
}
