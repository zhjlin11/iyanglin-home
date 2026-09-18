import { redirect } from "next/navigation";

export default function AdminCommunityPage() {
  redirect("/admin/content?kind=post");
}
