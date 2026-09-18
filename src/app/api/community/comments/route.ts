import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createPostComment } from "@/lib/community-store";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再发表回复" }, { status: 401 });
  }

  // 检查禁言状态
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { status: true, bannedUntil: true },
  });

  if (user?.status === "DISABLED") {
    return NextResponse.json({ error: "账号已被限制使用" }, { status: 403 });
  }

  if (user?.bannedUntil && new Date(user.bannedUntil) > new Date()) {
    return NextResponse.json({
      error: `您已被禁言至 ${new Date(user.bannedUntil).toLocaleString("zh-CN")}`,
    }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.postId || !body.content || !String(body.content).trim()) {
    return NextResponse.json({ error: "回复内容不能为空" }, { status: 400 });
  }

  const comment = await createPostComment({
    postId: String(body.postId),
    content: String(body.content).trim(),
    parentId: body.parentId ? String(body.parentId).trim() : undefined,
    authorId: session.id,
  });

  return NextResponse.json({ comment }, { status: 201 });
}
