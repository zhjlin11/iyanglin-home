import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const { endpointId } = await req.json();
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      return NextResponse.json({ success: false, error: "Webhook 终端不存在" }, { status: 404 });
    }

    const testPayload = {
      event: "ping.test",
      timestamp: new Date().toISOString(),
      message: "这是来自杨林生活网开发者中心的连通性自测 Ping 报文",
      organizationId: endpoint.organizationId,
    };
    const payloadStr = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac("sha256", endpoint.secret)
      .update(payloadStr)
      .digest("hex");

    const startTime = Date.now();
    let status = "SUCCESS";
    let statusCode = 200;
    let responseText = "";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Yanglin-Event": "ping.test",
          "X-Signature-SHA256": signature,
        },
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = res.status;
      responseText = await res.text().catch(() => "");
      if (!res.ok) status = "FAILED";
    } catch (e: any) {
      status = "FAILED";
      statusCode = 500;
      responseText = e.message;
    }

    const durationMs = Date.now() - startTime;

    // 记录测试交付记录
    const delivery = await prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        event: "ping.test",
        payloadJson: payloadStr,
        status,
        statusCode,
        response: responseText.slice(0, 300),
        durationMs,
      },
    });

    return NextResponse.json({
      success: true,
      delivery,
      status,
      statusCode,
      durationMs,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
