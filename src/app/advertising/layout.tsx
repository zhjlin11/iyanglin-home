import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "广告投放 - 杨林生活网 | 本地商家推广平台",
  description:
    "杨林生活网广告投放服务，覆盖杨林镇、大学城、经开区本地用户。提供首页Banner、列表置顶、商家推荐等多种广告位，适合餐饮、房产、招聘、教育等本地商家推广。",
  keywords: [
    "杨林广告",
    "杨林推广",
    "杨林本地推广",
    "杨林生活网广告",
    "杨林商家推广",
    "杨林大学城广告",
  ],
  openGraph: {
    title: "广告投放 - 杨林生活网",
    description:
      "让更多杨林人看到你的生意。覆盖杨林镇、大学城、经开区本地用户的广告推广平台。",
    type: "website",
  },
};

export default function AdvertisingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
