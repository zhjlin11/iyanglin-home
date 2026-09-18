import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUnifiedQrCode, recordQrScan, QrResourceType } from "@/lib/qr-service";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const codeKey = searchParams.get("codeKey");

  if (codeKey) {
    const updated = await recordQrScan(codeKey);
    return NextResponse.json({ success: true, qr: updated });
  }

  return NextResponse.json({ error: "缺少 codeKey" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { title, resourceType, resourceId, organizationId, source, campaign } = body;

  if (!title || !resourceType) {
    return NextResponse.json({ error: "缺少 title 或 resourceType" }, { status: 400 });
  }

  const qr = await getOrCreateUnifiedQrCode({
    title,
    resourceType: resourceType as QrResourceType,
    resourceId,
    organizationId,
    source,
    campaign,
  });

  return NextResponse.json({ success: true, qr });
}
