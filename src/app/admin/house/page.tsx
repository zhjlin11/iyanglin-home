import { redirect } from "next/navigation";

export default function AdminHousePage() {
  redirect("/admin/content?kind=house");
}
