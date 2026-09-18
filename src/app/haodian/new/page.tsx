import { redirect } from "next/navigation";

export const metadata = {
  title: "杨林生活网自营商城",
  robots: { index: false, follow: false },
};

export default function RetiredMerchantEntryPage() {
  redirect("/haodian");
}
