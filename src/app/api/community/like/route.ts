import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { togglePostLike } from "@/lib/community-store";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再进行点赞" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.postId) {
    return NextResponse.json({ error: "缺少 postId" }, { status: 400 });
  }

  const result = await togglePostLike(String(body.postId), session.id);
  return NextResponse.json(result);
}
