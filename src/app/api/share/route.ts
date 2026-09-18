import { NextResponse } from "next/server";
import { getResourceShareMetadata, SupportedResourceType } from "@/lib/share-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "缺少 type 或 id 参数" }, { status: 400 });
  }

  try {
    const meta = await getResourceShareMetadata(type as SupportedResourceType, id);
    if (!meta) {
      return NextResponse.json({ error: "目标资源不存在或已下架" }, { status: 404 });
    }

    return NextResponse.json({ success: true, share: meta });
  } catch (err: any) {
    console.error("[API /api/share] Failed to get share metadata:", err);
    return NextResponse.json({ error: err.message || "获取分享元数据失败" }, { status: 500 });
  }
}
