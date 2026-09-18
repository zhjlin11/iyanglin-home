import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://iyanglin.com";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/jobs`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${baseUrl}/house`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${baseUrl}/info`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${baseUrl}/haodian`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/active`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/love`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "always", priority: 0.8 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/bianmin`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];

  try {
    // Dynamic detail routes
    const [jobs, houses, listings, shops, events, posts, articles, datingProfiles] = await Promise.all([
      prisma.job.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
      prisma.house.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
      prisma.listing.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
      prisma.shop.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
      prisma.event.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
      prisma.post.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
      prisma.article.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
      prisma.datingProfile.findMany({ where: { status: "APPROVED" }, select: { id: true, updatedAt: true }, take: 200 }),
    ]);

    const jobUrls: MetadataRoute.Sitemap = jobs.map((j) => ({
      url: `${baseUrl}/jobs/${j.id}`,
      lastModified: j.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const houseUrls: MetadataRoute.Sitemap = houses.map((h) => ({
      url: `${baseUrl}/house/${h.id}`,
      lastModified: h.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const listingUrls: MetadataRoute.Sitemap = listings.map((l) => ({
      url: `${baseUrl}/info/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const shopUrls: MetadataRoute.Sitemap = shops.map((s) => ({
      url: `${baseUrl}/haodian/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
      url: `${baseUrl}/active/${e.id}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${baseUrl}/community/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${baseUrl}/articles/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const loveUrls: MetadataRoute.Sitemap = datingProfiles.map((d) => ({
      url: `${baseUrl}/love/${d.id}`,
      lastModified: d.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...jobUrls, ...houseUrls, ...listingUrls, ...shopUrls, ...eventUrls, ...postUrls, ...articleUrls, ...loveUrls];
  } catch {
    return staticRoutes;
  }
}
