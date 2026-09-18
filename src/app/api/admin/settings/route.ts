import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [settings, featureFlags] = await Promise.all([
    prisma.systemSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
  ]);

  return NextResponse.json({ settings, featureFlags });
}

export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session || session.role.toUpperCase() !== "ADMIN") {
    return NextResponse.json({ error: "Only superadmin can modify system settings" }, { status: 403 });
  }

  const body = await req.json();
  const { settings, featureFlags } = body;

  if (Array.isArray(settings)) {
    for (const item of settings) {
      if (item.key && item.value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: item.key },
          update: { value: String(item.value), group: item.group || "SITE", updatedBy: session.username },
          create: { key: item.key, value: String(item.value), group: item.group || "SITE", updatedBy: session.username },
        });

        // 物理覆盖公共静态资源以确保强缓存击穿
        try {
          const fs = await import("fs");
          const path = await import("path");
          if (item.key === "site_icon" && item.value && String(item.value).startsWith("/uploads/")) {
            const sourcePath = path.join(process.cwd(), "public", String(item.value));
            const targetFavicon = path.join(process.cwd(), "public", "favicon.ico");
            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, targetFavicon);
            }
          }
          if (item.key === "site_logo" && item.value && String(item.value).startsWith("/uploads/")) {
            const sourcePath = path.join(process.cwd(), "public", String(item.value));
            const targetLogo = path.join(process.cwd(), "public", "images", "logo", "yanglin_icon_v2_512px.png");
            if (fs.existsSync(sourcePath)) {
              fs.copyFileSync(sourcePath, targetLogo);
            }
          }
        } catch {}
      }
    }
  }

  if (Array.isArray(featureFlags)) {
    for (const flag of featureFlags) {
      if (flag.key && flag.enabled !== undefined) {
        await prisma.featureFlag.upsert({
          where: { key: flag.key },
          update: { enabled: Boolean(flag.enabled), name: flag.name || flag.key, updatedBy: session.username },
          create: { key: flag.key, name: flag.name || flag.key, enabled: Boolean(flag.enabled), updatedBy: session.username },
        });
      }
    }
  }

  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: "update_system_settings",
      metadata: { settingsCount: settings?.length || 0, flagsCount: featureFlags?.length || 0 },
    },
  });

  // 关键：修改配置后实时强刷 Next.js 全局根布局服务端缓存
  try {
    revalidatePath("/", "layout");
  } catch {}

  return NextResponse.json({ success: true });
}
