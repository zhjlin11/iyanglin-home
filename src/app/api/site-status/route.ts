import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ["site_status", "site_close_reason", "customer_phone", "site_name", "site_logo", "site_icon", "footer_text"] }
      }
    });

    const map: Record<string, string> = {
      site_status: "ONLINE",
      site_close_reason: "网站正在进行系统架构与服务器例行升级维护中，请稍后再试...",
      customer_phone: "18006778483",
      site_name: "杨林生活网",
      site_logo: "/images/logo/yanglin_icon_v2_512px.png",
      site_icon: "/images/logo/yanglin_icon_v2_512px.png",
      footer_text: "© 2026 杨林生活网 版权所有 · 专注本地生活服务"
    };

    settings.forEach(s => {
      map[s.key] = s.value;
    });

    return NextResponse.json({
      siteStatus: map.site_status || "ONLINE",
      closeReason: map.site_close_reason,
      customerPhone: map.customer_phone,
      siteName: map.site_name || "杨林生活网",
      siteLogo: map.site_logo || "/images/logo/yanglin_icon_v2_512px.png",
      siteIcon: map.site_icon || "/images/logo/yanglin_icon_v2_512px.png",
      footerText: map.footer_text || "© 2026 杨林生活网 版权所有 · 专注本地生活服务"
    });
  } catch {
    return NextResponse.json({
      siteStatus: "ONLINE",
      closeReason: "网站例行维护中",
      customerPhone: "18006778483",
      siteName: "杨林生活网",
      siteLogo: "/images/logo/yanglin_icon_v2_512px.png",
      siteIcon: "/images/logo/yanglin_icon_v2_512px.png",
      footerText: "© 2026 杨林生活网 版权所有 · 专注本地生活服务"
    });
  }
}
