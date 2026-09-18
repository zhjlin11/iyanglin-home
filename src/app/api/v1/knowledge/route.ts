import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  const organizationId = req.nextUrl.searchParams.get("organizationId") || undefined;
  const category = req.nextUrl.searchParams.get("category") || undefined;

  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      status: "VERIFIED",
      OR: [
        { organizationId: null }, // 全平台公共知识
        ...(organizationId ? [{ organizationId }] : []), // 企业私有知识库
      ],
      ...(category ? { category } : {}),
    },
    orderBy: { helpfulCount: "desc" },
  });

  return NextResponse.json({ success: true, articles });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  }

  try {
    const { title, category, content, source, organizationId } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ success: false, error: "标题与内容不能为空" }, { status: 400 });
    }

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        category: category || "GUIDE",
        content,
        source: source || "用户/企业贡献",
        owner: session.username || "管理员",
        organizationId: organizationId || null,
        status: organizationId ? "VERIFIED" : "DRAFT", // 企业私有知识直接可用，全局知识需审核
      },
    });

    return NextResponse.json({ success: true, article });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
