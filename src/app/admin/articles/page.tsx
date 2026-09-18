import { redirect } from "next/navigation";

export default function AdminArticlesPage() {
  redirect("/admin/content?kind=article");
}
