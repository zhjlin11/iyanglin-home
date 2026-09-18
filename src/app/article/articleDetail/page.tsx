import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ArticleRedirect({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const id = params.id;
  
  if (!id) return notFound();

  const article = await prisma.article.findUnique({
    where: { oldId: id },
  });

  if (article) {
    redirect(`/articles/${article.id}`);
  }

  // 如果找不到老文章，直接跳回文章列表以免 404
  redirect(`/articles`);
}
