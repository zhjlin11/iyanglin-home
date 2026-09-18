import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "杨林生活网使用指南 - 找工作、找房子、发布信息教程",
  description:
    "第一次使用杨林生活网？查看找工作、租房、二手、商家、信息发布、公众号使用等快速指南。",
  keywords: [
    "杨林生活网",
    "新手指南",
    "杨林找工作",
    "杨林租房",
    "杨林二手",
    "杨林本地商家",
    "杨林发布信息",
  ],
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
