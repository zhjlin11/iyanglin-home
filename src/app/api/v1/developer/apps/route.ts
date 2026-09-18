import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDeveloperApp } from "@/lib/developer/developer-service";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  const organizationId = req.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ success: false, error: "缺少组织ID" }, { status: 400 });
  }

  const [keys, webhooks] = await Promise.all([
    prisma.apiKeyConfig.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        enabled: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
    prisma.webhookEndpoint.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        deliveries: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  return NextResponse.json({ success: true, keys, webhooks });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, organizationId } = body;

    if (action === "create_key") {
      const { name, scopes } = body;
      const app = await createDeveloperApp({
        organizationId,
        name: name || "默认集成应用",
        scopes,
      });
      return NextResponse.json({ success: true, app });
    }

    if (action === "create_webhook") {
      const { url, events } = body;
      if (!url?.startsWith("http")) {
        return NextResponse.json({ success: false, error: "必须是合法的 HTTP/HTTPS 链接" }, { status: 400 });
      }

      const secret = "whsec_" + crypto.randomBytes(16).toString("hex");
      const webhook = await prisma.webhookEndpoint.create({
        data: {
          organizationId,
          url,
          secret,
          events: events || ["order.completed", "lead.created", "candidate.applied"],
        },
      });

      return NextResponse.json({ success: true, webhook });
    }

    return NextResponse.json({ success: false, error: "未知操作" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
