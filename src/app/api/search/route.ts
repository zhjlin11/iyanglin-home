import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export interface SearchResultItem {
  id: string;
  resourceType:
    | "JOB"
    | "HOUSE"
    | "LISTING"
    | "SHOP"
    | "EVENT"
    | "DATING"
    | "POST"
    | "INDUSTRIAL"
    | "SERVICE_PRODUCT";
  title: string;
  summary: string;
  image?: string;
  category: string;
  location: string;
  priceOrMeta: string;
  status: string;
  publishedAt: string;
  url: string;
  score: number;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim();

  // Navbar 下拉框传入的 type 值与 API 内部 type 键的映射
  const typeAliases: Record<string, string> = {
    JOBS: "JOB",
    JOB: "JOB",
    INFO: "LISTING",
    LISTING: "LISTING",
    ARTICLES: "ALL",
    HAODIAN: "SHOP",
    SHOP: "SHOP",
    COMMUNITY: "POST",
    POST: "POST",
    HOUSE: "HOUSE",
    INDUSTRIAL: "INDUSTRIAL",
    PARK: "INDUSTRIAL",
    SERVICES: "SERVICE_PRODUCT",
    SERVICE: "SERVICE_PRODUCT",
  };
  const rawType = (searchParams.get("type") || "ALL").toUpperCase();
  const typeFilter = typeAliases[rawType] || rawType;

  const sort = searchParams.get("sort") || "relevance";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 50);

  const session = await getSession(request);
  const userId = session?.id !== "env-admin" ? session?.id : undefined;

  if (!query) {
    return NextResponse.json({
      query: "",
      total: 0,
      page: 1,
      pageSize,
      durationMs: 0,
      items: [],
      hotKeywords: ["招聘", "租房", "露营", "相亲", "干洗点", "工业园区"],
    });
  }

  try {
    const results: SearchResultItem[] = [];

    // Helper to calculate relevance score
    const calcScore = (title: string, bodyText: string, location: string, category: string): number => {
      let score = 0;
      const lowerQ = query.toLowerCase();
      const lowerTitle = title.toLowerCase();
      const lowerBody = bodyText.toLowerCase();

      if (lowerTitle === lowerQ) score += 100;
      else if (lowerTitle.startsWith(lowerQ)) score += 80;
      else if (lowerTitle.includes(lowerQ)) score += 50;

      if (category.toLowerCase().includes(lowerQ)) score += 30;
      if (location.toLowerCase().includes(lowerQ)) score += 20;
      if (lowerBody.includes(lowerQ)) score += 10;

      return score;
    };

    // 1. Search Job
    if (typeFilter === "ALL" || typeFilter === "JOB") {
      const jobs = await prisma.job.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
            { area: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      jobs.forEach((j) => {
        const score = calcScore(j.title, j.body, j.area, j.company);
        results.push({
          id: j.id,
          resourceType: "JOB",
          title: j.title,
          summary: `${j.company} | ${j.body.slice(0, 80)}...`,
          image: j.images && j.images.length > 0 ? j.images[0] : undefined,
          category: "求职招聘",
          location: j.area,
          priceOrMeta: j.salary,
          status: "approved",
          publishedAt: j.createdAt.toISOString(),
          url: `/jobs/${j.id}`,
          score,
        });
      });
    }

    // 2. Search House
    if (typeFilter === "ALL" || typeFilter === "HOUSE") {
      const houses = await prisma.house.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      houses.forEach((h) => {
        const score = calcScore(h.title, h.body, h.location, h.houseType);
        results.push({
          id: h.id,
          resourceType: "HOUSE",
          title: h.title,
          summary: `${h.layout} | ${h.areaSize} | ${h.body.slice(0, 80)}...`,
          image: h.images && h.images.length > 0 ? h.images[0] : undefined,
          category: "房产楼市",
          location: h.location,
          priceOrMeta: h.price,
          status: "approved",
          publishedAt: h.createdAt.toISOString(),
          url: `/house/${h.id}`,
          score,
        });
      });
    }

    // 3. Search Listing
    if (typeFilter === "ALL" || typeFilter === "LISTING") {
      const listings = await prisma.listing.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      listings.forEach((l) => {
        const score = calcScore(l.title, l.body, "杨林本地", l.category);
        results.push({
          id: l.id,
          resourceType: "LISTING",
          title: l.title,
          summary: l.body.slice(0, 80) + "...",
          image: l.images && l.images.length > 0 ? l.images[0] : undefined,
          category: l.category || "分类信息",
          location: "杨林本地",
          priceOrMeta: "二手/服务",
          status: "approved",
          publishedAt: l.createdAt.toISOString(),
          url: `/info/${l.id}`,
          score,
        });
      });
    }

    // 4. Search Shop
    if (typeFilter === "ALL" || typeFilter === "SHOP") {
      const shops = await prisma.shop.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { intro: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      shops.forEach((s) => {
        const score = calcScore(s.name, s.intro, s.address, s.category);
        results.push({
          id: s.id,
          resourceType: "SHOP",
          title: s.name,
          summary: `营业时间：${s.hours} | ${s.intro.slice(0, 80)}...`,
          image: s.logo || (s.images && s.images.length > 0 ? s.images[0] : undefined),
          category: "商家黄页",
          location: s.address,
          priceOrMeta: "好店商家",
          status: "approved",
          publishedAt: s.createdAt.toISOString(),
          url: `/haodian/${s.id}`,
          score,
        });
      });
    }

    // 5. Search Event
    if (typeFilter === "ALL" || typeFilter === "EVENT") {
      const events = await prisma.event.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { intro: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      events.forEach((e) => {
        const score = calcScore(e.title, e.intro, e.location, e.category);
        results.push({
          id: e.id,
          resourceType: "EVENT",
          title: e.title,
          summary: `时间：${e.eventTime} | ${e.intro.slice(0, 80)}...`,
          image: e.images && e.images.length > 0 ? e.images[0] : undefined,
          category: "同城活动",
          location: e.location,
          priceOrMeta: e.fee,
          status: "approved",
          publishedAt: e.createdAt.toISOString(),
          url: `/active/${e.id}`,
          score,
        });
      });
    }

    // 6. Search Dating (Strict Privacy: Only return public info)
    if (typeFilter === "ALL" || typeFilter === "DATING") {
      const datings = await prisma.datingProfile.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { nickname: { contains: query, mode: "insensitive" } },
            { occupation: { contains: query, mode: "insensitive" } },
            { intro: { contains: query, mode: "insensitive" } },
            { requirement: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      const currentYear = new Date().getFullYear();
      datings.forEach((d) => {
        const age = currentYear - d.birthYear;
        const genderText = d.gender === "female" ? "女嘉宾" : "男嘉宾";
        const score = calcScore(d.nickname, d.intro, d.location, d.occupation);
        results.push({
          id: d.id,
          resourceType: "DATING",
          title: `${d.nickname} (${genderText} · ${age}岁)`,
          summary: `${d.education} | ${d.occupation} | 择偶要求：${d.requirement.slice(0, 60)}...`,
          image: d.photos && d.photos.length > 0 ? d.photos[0] : undefined,
          category: "相亲交友",
          location: d.location,
          priceOrMeta: d.income,
          status: "approved",
          publishedAt: d.createdAt.toISOString(),
          url: `/love/${d.id}`,
          score,
        });
      });
    }

    // 7. Search Post
    if (typeFilter === "ALL" || typeFilter === "POST") {
      const posts = await prisma.post.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
            { board: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      posts.forEach((p) => {
        const score = calcScore(p.title, p.body, "杨林社区", p.board);
        results.push({
          id: p.id,
          resourceType: "POST",
          title: p.title,
          summary: p.body.slice(0, 80) + "...",
          image: p.images && p.images.length > 0 ? p.images[0] : undefined,
          category: "社区论坛",
          location: "杨林社区",
          priceOrMeta: `${p.viewsCount} 次浏览`,
          status: "approved",
          publishedAt: p.createdAt.toISOString(),
          url: `/community/${p.id}`,
          score,
        });
      });
    }

    // 8. Search Industrial
    if (typeFilter === "ALL" || typeFilter === "INDUSTRIAL") {
      const industrials = await prisma.industrialProperty.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { parkName: { contains: query, mode: "insensitive" } },
            { region: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 30,
      });

      industrials.forEach((i) => {
        const score = calcScore(i.title, i.parkName || "", i.region || i.address || "杨林", i.propertyType);
        results.push({
          id: i.id,
          resourceType: "INDUSTRIAL",
          title: i.title,
          summary: `${i.parkName || "经开区"} | 面积约 ${i.buildingArea || i.landArea || "若干"}㎡ | ${(i.suitableIndustries || []).slice(0, 3).join(", ")}`,
          image: i.images && i.images.length > 0 ? i.images[0] : undefined,
          category: "园区招商",
          location: i.region || i.address || "杨林经开区",
          priceOrMeta: i.rentPrice ? `¥${i.rentPrice}/㎡/月` : "价格面议",
          status: "approved",
          publishedAt: i.createdAt.toISOString(),
          url: `/industrial/${i.id}`,
          score,
        });
      });
    }

    // 9. Search Service Product
    if (typeFilter === "ALL" || typeFilter === "SERVICE_PRODUCT") {
      const products = await prisma.serviceProduct.findMany({
        where: {
          status: "ONLINE",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          provider: {
            select: { name: true, phone: true },
          },
        },
        take: 30,
      });

      products.forEach((p) => {
        const score = calcScore(p.title, p.description, "杨林本地", p.category);
        results.push({
          id: p.id,
          resourceType: "SERVICE_PRODUCT",
          title: p.title,
          summary: `${p.provider.name} | ${p.description.slice(0, 80)}...`,
          image: p.images && p.images.length > 0 ? p.images[0] : undefined,
          category: "本地服务",
          location: "上门服务",
          priceOrMeta: `¥${(p.priceCents / 100).toFixed(0)}`,
          status: "approved",
          publishedAt: p.createdAt.toISOString(),
          url: `/services/${p.id}`,
          score,
        });
      });
    }

    // Sort results based on sort criteria
    if (sort === "latest") {
      results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      // Relevance sort (default)
      results.sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    const total = results.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = results.slice(startIndex, startIndex + pageSize);

    const durationMs = Date.now() - startTime;

    // Log Search Asynchronously to SearchLog
    prisma.searchLog.create({
      data: {
        keyword: query,
        normalizedKeyword: query.toLowerCase(),
        userId,
        resultCount: total,
        resourceType: typeFilter === "ALL" ? null : typeFilter,
        durationMs,
      },
    }).catch(() => {});

    return NextResponse.json({
      query,
      total,
      page,
      pageSize,
      durationMs,
      items: paginatedItems,
      hotKeywords: ["招聘", "租房", "露营", "相亲", "干洗点", "工业园区"],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "搜索引擎服务异常" }, { status: 500 });
  }
}
