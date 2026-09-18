import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (session.id === "env-admin") {
    return NextResponse.json({ items: [] });
  }

  try {
    const userId = session.id;

    const [jobs, houses, listings, shops, events, dating, posts] = await Promise.all([
      prisma.job.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.house.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.listing.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.shop.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.event.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.datingProfile.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.post.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
    ]);

    const items = [
      ...jobs.map((x) => ({ id: x.id, module: "JOB", title: x.title, status: x.status.toLowerCase(), link: `/jobs/${x.id}`, createdAt: x.createdAt })),
      ...houses.map((x) => ({ id: x.id, module: "HOUSE", title: x.title, status: x.status.toLowerCase(), link: `/house/${x.id}`, createdAt: x.createdAt })),
      ...listings.map((x) => ({ id: x.id, module: "LISTING", title: x.title, status: x.status.toLowerCase(), link: `/info/${x.id}`, createdAt: x.createdAt, refreshedAt: x.refreshedAt })),
      ...shops.map((x) => ({ id: x.id, module: "SHOP", title: x.name, status: x.status.toLowerCase(), link: `/haodian/${x.id}`, createdAt: x.createdAt })),
      ...events.map((x) => ({ id: x.id, module: "EVENT", title: x.title, status: x.status.toLowerCase(), link: `/active/${x.id}`, createdAt: x.createdAt })),
      ...dating.map((x) => ({ id: x.id, module: "DATING", title: `${x.nickname} (${x.gender === "female" ? "女嘉宾" : "男嘉宾"})`, status: x.status.toLowerCase(), link: `/love/${x.id}`, createdAt: x.createdAt })),
      ...posts.map((x) => ({ id: x.id, module: "POST", title: x.title, status: x.status.toLowerCase(), link: `/community/${x.id}`, createdAt: x.createdAt })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "获取失败" }, { status: 500 });
  }
}
