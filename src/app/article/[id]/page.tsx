import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArticleAliasPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/articles/${id}`);
}
