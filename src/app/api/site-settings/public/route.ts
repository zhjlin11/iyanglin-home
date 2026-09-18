import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "site_name",
            "site_short_name",
            "site_logo",
            "site_icon",
            "site_desc",
            "icp_beian",
            "gongan_beian",
            "customer_phone",
            "contact_email",
            "company_name",
            "footer_text",
            "site_notice",
          ],
        },
      },
    });

    const map: Record<string, string> = {
      site_name: "杨林生活网",
      site_short_name: "杨林生活",
      site_logo: "/images/logo/yanglin_icon_v2_512px.png",
      site_icon: "/images/logo/yanglin_icon_v2_512px.png",
      site_desc: "杨林本地求职、租房、商家与便民信息汇总平台",
      customer_phone: "18006778483",
      footer_text: "© 2026 杨林生活网 版权所有 · 专注本地生活服务",
    };

    settings.forEach((s) => {
      if (s.value) map[s.key] = s.value;
    });

    return NextResponse.json({ success: true, settings: map });
  } catch {
    return NextResponse.json({
      success: true,
      settings: {
        site_name: "杨林生活网",
        site_logo: "/images/logo/yanglin_icon_v2_512px.png",
      },
    });
  }
}
