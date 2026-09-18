import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createPost, getPost, listPosts, updatePost } from "@/lib/community-store";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const session = await getSession(request);

  if (id) {
    const item = await getPost(id, session?.id);
    return NextResponse.json({ item, items: item ? [item] : [] });
  }

  const board = searchParams.get("board") || undefined;
  const category = searchParams.get("category") || undefined;
  const topic = searchParams.get("topic") || undefined;
  const status = searchParams.get("status") || undefined;
  const sort = (searchParams.get("sort") as any) || undefined;
  const mine = searchParams.get("mine") === "true";
  const search = searchParams.get("q") || undefined;

  let authorId: string | undefined;
  if (mine) {
    if (!session) {
      return NextResponse.json({ items: [] });
    }
    authorId = session.id;
  }

  const items = await listPosts({
    board,
    category,
    topic,
    status,
    authorId,
    search,
    sort,
    currentUserId: session?.id,
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再发表贴子" }, { status: 401 });
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
      error: `您已被禁言至 ${new Date(user.bannedUntil).toLocaleString("zh-CN")}，请遵守社区文明规范`,
    }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.title || !body.body) {
    return NextResponse.json({ error: "贴子标题和正文不能为空" }, { status: 400 });
  }

  const statusInput = typeof body.status === "string" ? body.status.toLowerCase() : "pending";
  const status = session.role === "ADMIN" ? statusInput : "pending";
  const authorId = session.id;

  const item = await createPost({
    title: String(body.title).trim(),
    board: typeof body.board === "string" ? body.board.trim() : "yanglin",
    category: typeof body.category === "string" ? body.category.trim() : "share",
    body: String(body.body).trim(),
    status,
    authorId,
    images: Array.isArray(body.images) ? body.images : [],
    topics: Array.isArray(body.topics) ? body.topics.map((t: string) => String(t).trim()).filter(Boolean) : [],
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession(request);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "无管理员权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: "缺少必要字段 id 或 status" }, { status: 400 });
  }

  const item = await updatePost(body.id, body.status, {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    board: typeof body.board === "string" ? body.board.trim() : undefined,
    category: typeof body.category === "string" ? body.category.trim() : undefined,
    body: typeof body.body === "string" ? body.body.trim() : undefined,
    images: Array.isArray(body.images) ? body.images : undefined,
    topics: Array.isArray(body.topics) ? body.topics : undefined,
    isTop: typeof body.isTop === "boolean" ? body.isTop : undefined,
    isFeatured: typeof body.isFeatured === "boolean" ? body.isFeatured : undefined,
    resolvedStatus: typeof body.resolvedStatus === "string" ? body.resolvedStatus : undefined,
  });

  return NextResponse.json({ item });
}
