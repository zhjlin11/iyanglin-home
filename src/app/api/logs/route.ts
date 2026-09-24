import { NextResponse } from "next/server";
import { GET as adminGet } from "@/app/api/admin/logs/route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 保持 /api/logs 与 /api/admin/logs 完全同源并向前兼容
  return adminGet(request);
}
