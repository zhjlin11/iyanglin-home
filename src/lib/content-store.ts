import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";

export type ContentStatus = "draft" | "pending" | "approved" | "offline";
export type ContentKind = "article" | "job" | "listing" | "house" | "shop" | "post" | "event" | "love";

const formatOccupation = (occ: any) => {
  if (!occ || occ === "0" || occ === 0 || occ.includes("代码 0") || occ.includes("代码0")) return "企事业单位/教育";
  if (occ === "1" || occ === 1 || occ.includes("代码 1") || occ.includes("代码1")) return "经开区企业/技术";
  if (occ === "2" || occ === 2 || occ.includes("代码 2") || occ.includes("代码2")) return "医疗卫生/健康";
  if (occ === "3" || occ === 3 || occ.includes("代码 3") || occ.includes("代码3")) return "IT/互联网";
  if (occ === "4" || occ === 4 || occ.includes("代码 4") || occ.includes("代码4")) return "金融/财会/管理";
  if (occ === "5" || occ === 5 || occ.includes("代码 5") || occ.includes("代码5")) return "个体经商/创业";
  return String(occ).replace(/职业代码\s*\d+/g, "企事业单位/技术");
};

const mapLove = (item: any): ContentItem => ({
  id: item.id,
  kind: "love",
  title: `${item.nickname} (${item.gender === "female" ? "女" : "男"}, ${new Date().getFullYear() - (item.birthYear || 1995)}岁 · ${formatOccupation(item.occupation)})`,
  category: item.gender === "female" ? "女嘉宾" : "男嘉宾",
  contact: item.contact,
  body: item.intro,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  authorId: item.authorId || undefined,
  images: item.photos || [],
  oldId: item.oldId,
});

const mapEvent = (item: any): ContentItem => ({
  id: item.id,
  kind: "event",
  title: item.title,
  category: item.category,
  contact: item.contact,
  eventTime: item.eventTime,
  location: item.location,
  fee: item.fee,
  quota: item.quota,
  body: item.intro,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
  isTop: item.isTop,
});

const mapPost = (item: any): ContentItem => ({
  id: item.id,
  kind: "post",
  title: item.title,
  category: item.board,
  body: item.body,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt.toISOString(),
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
});
export type ContentItem = {
  id: string;
  kind: ContentKind;
  title: string;
  company?: string;
  category?: string;
  subCategory?: string;
  itemType?: string;
  contact?: string;
  contactName?: string;
  wechat?: string;
  body: string;
  status: ContentStatus;
  createdAt: string;
  refreshedAt?: string;
  viewsCount?: number;
  likesCount?: number;
  jobType?: string;
  area?: string;
  salary?: string;
  authorId?: string;
  images?: string[];
  oldId?: string | null;
  isTop?: boolean;
  topUntil?: Date | null;
  address?: string;
  hours?: string;
  phone?: string;
  eventTime?: string;
  location?: string;
  fee?: string;
  quota?: string;
  price?: string;
  priceNum?: number;
  priceUnit?: string;
  condition?: string;
  departureTime?: string;
  fromPlace?: string;
  toPlace?: string;
  rejectReason?: string;
  expiresAt?: string;
  isFeatured?: boolean;
  extraData?: any;
};

const statusValue = (status: ContentStatus) => status.toUpperCase() as any;

const mapArticle = (item: any): ContentItem => ({
  id: item.id,
  kind: "article",
  title: item.title,
  body: item.body,
  category: item.category,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt.toISOString(),
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
});

const mapHouseTypeLabel = (ht: string) => {
  if (ht === "rent" || ht === "出租") return "房屋出租";
  if (ht === "secondhand" || ht === "二手房") return "二手房买卖";
  if (ht === "newhouse" || ht === "新房") return "新房楼盘";
  if (ht === "shop" || ht === "商铺") return "商铺/写字楼";
  return ht || "房产住宅";
};

const mapJob = (item: any): ContentItem => {
  let contact = "";
  if (item.body) {
    const m = item.body.match(/【联系方式】([^\n]+)/);
    if (m && m[1] && m[1].trim() && m[1].trim() !== "暂无电话" && m[1].trim() !== "010-88888888") {
      contact = m[1].trim();
    } else {
      const pm = item.body.match(/1[3-9]\d{9}/);
      if (pm) contact = pm[0];
    }
  }
  if (!contact && item.author?.phone) {
    contact = item.author.phone;
  }

  return {
    id: item.id,
    kind: "job",
    title: item.title,
    company: item.company,
    body: item.body,
    contact: contact || undefined,
    jobType: item.jobType,
    area: item.area,
    salary: item.salary || "薪资面议",
    status: item.status.toLowerCase(),
    createdAt: item.createdAt.toISOString(),
    authorId: item.authorId || undefined,
    images: item.images || [],
    oldId: item.oldId,
    isTop: item.isTop,
  };
};

const mapListing = (item: any): ContentItem => ({
  id: item.id,
  kind: "listing",
  title: item.title,
  category: item.category || "二手闲置",
  subCategory: item.subCategory || undefined,
  itemType: item.itemType || "OFFER",
  price: item.price || "面议",
  priceNum: item.priceNum ?? undefined,
  priceUnit: item.priceUnit || "元",
  condition: item.condition || undefined,
  area: item.area || "杨林经开区",
  address: item.address || undefined,
  contact: item.contact,
  contactName: item.contactName || undefined,
  wechat: item.wechat || undefined,
  body: item.body,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  refreshedAt: item.refreshedAt ? new Date(item.refreshedAt).toISOString() : undefined,
  viewsCount: item.viewsCount ?? 0,
  likesCount: item.likesCount ?? 0,
  departureTime: item.departureTime || undefined,
  fromPlace: item.fromPlace || undefined,
  toPlace: item.toPlace || undefined,
  rejectReason: item.rejectReason || undefined,
  expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : undefined,
  isFeatured: item.isFeatured ?? false,
  extraData: item.extraData || undefined,
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
  isTop: item.isTop,
  topUntil: item.topUntil,
});

const mapHouse = (item: any): ContentItem => ({
  id: item.id,
  kind: "house",
  title: item.title,
  category: mapHouseTypeLabel(item.houseType),
  contact: item.contact,
  price: item.price,
  location: item.location,
  body: item.body,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt.toISOString(),
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
  isTop: item.isTop,
});

const mapShop = (item: any): ContentItem => ({
  id: item.id,
  kind: "shop",
  title: item.name,
  category: item.category === "food" ? "特色美食" : item.category === "service" ? "生活服务" : item.category === "entertainment" ? "休闲娱乐" : item.category === "digital" ? "数码汽修" : item.category || "好店名录",
  contact: item.phone,
  phone: item.phone,
  address: item.address,
  hours: item.hours,
  body: item.intro,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt.toISOString(),
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
  isTop: item.isTop,
});

export async function getContent(id: string): Promise<ContentItem | null> {
  const article = await prisma.article.findUnique({ where: { id } });
  if (article) return mapArticle(article);
  const job = await prisma.job.findUnique({ where: { id } });
  if (job) return mapJob(job);
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (listing) return mapListing(listing);
  const house = await prisma.house.findUnique({ where: { id } });
  if (house) return mapHouse(house);
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (shop) return mapShop(shop);
  const post = await prisma.post.findUnique({ where: { id } });
  if (post) return mapPost(post);
  const event = await prisma.event.findUnique({ where: { id } });
  if (event) return mapEvent(event);
  const love = await prisma.datingProfile.findUnique({ where: { id } });
  if (love) return mapLove(love);
  return null;
}

export async function listContent(kind?: ContentKind, authorId?: string, options?: { limit?: number; includeAll?: boolean; category?: string }) {
  const take = options?.limit ?? undefined;
  const statusFilter = options?.includeAll ? {} : { status: "APPROVED" as any };
  const whereAuth = authorId ? { authorId } : {};
  const catFilter = options?.category ? { category: options.category } : {};
  const where = { ...statusFilter, ...whereAuth, ...catFilter };

  const [articles, jobs, listings, houses, shops, posts, events, loves] = await Promise.all([
    !kind || kind === "article" ? prisma.article.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
    !kind || kind === "job" ? prisma.job.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
    !kind || kind === "listing" ? prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
    !kind || kind === "house" ? prisma.house.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
    !kind || kind === "shop" ? prisma.shop.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
    !kind || kind === "post" ? prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
    !kind || kind === "event" ? prisma.event.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
    !kind || kind === "love" ? prisma.datingProfile.findMany({ where, orderBy: { createdAt: "desc" }, take }) : Promise.resolve([]),
  ]);

  return [...articles.map(mapArticle), ...jobs.map(mapJob), ...listings.map(mapListing), ...houses.map(mapHouse), ...shops.map(mapShop), ...posts.map(mapPost), ...events.map(mapEvent), ...loves.map(mapLove)].sort(
    (a, b) => {
      const aTop = a.isTop ? 1 : 0;
      const bTop = b.isTop ? 1 : 0;
      if (aTop !== bTop) return bTop - aTop;
      const aTime = a.refreshedAt ? Date.parse(a.refreshedAt) : Date.parse(a.createdAt);
      const bTime = b.refreshedAt ? Date.parse(b.refreshedAt) : Date.parse(b.createdAt);
      return bTime - aTime;
    },
  );
}

const readApprovedJobsPage = unstable_cache(
  async (page: number, pageSize: number) => {
    const where = { status: "APPROVED" as any };
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, items: jobs.map(mapJob) };
  },
  ["public-approved-jobs-page"],
  { revalidate: 60, tags: ["public-jobs"] },
);

/** Fast path for the default public jobs list: fetch only the visible page, not thousands of full job bodies. */
export async function listApprovedJobsPage(page: number, pageSize: number) {
  return readApprovedJobsPage(page, pageSize);
}

/** Server-side paginated listing with total count for admin content management */
export async function listContentPaginated(options: {
  kind?: ContentKind;
  status?: string;
  query?: string;
  page: number;
  pageSize: number;
}) {
  const { kind, status, query, page, pageSize } = options;
  const statusFilter = status && status !== "all" ? { status: status.toUpperCase() as any } : {};
  const queryFilter = query?.trim()
    ? { OR: [{ title: { contains: query.trim(), mode: "insensitive" as any } }, { body: { contains: query.trim(), mode: "insensitive" as any } }] }
    : {};
  const where = { ...statusFilter, ...queryFilter };
  // Shop uses 'name' instead of 'title', and 'intro' instead of 'body'
  const shopWhere = {
    ...statusFilter,
    ...(query?.trim() ? { OR: [{ name: { contains: query.trim(), mode: "insensitive" as any } }, { intro: { contains: query.trim(), mode: "insensitive" as any } }] } : {}),
  };
  const loveWhere = {
    ...statusFilter,
    ...(query?.trim() ? { OR: [{ nickname: { contains: query.trim(), mode: "insensitive" as any } }, { intro: { contains: query.trim(), mode: "insensitive" as any } }] } : {}),
  };

  // Count totals per kind
  const [cArticle, cJob, cListing, cHouse, cShop, cPost, cEvent, cLove] = await Promise.all([
    !kind || kind === "article" ? prisma.article.count({ where }) : 0,
    !kind || kind === "job" ? prisma.job.count({ where }) : 0,
    !kind || kind === "listing" ? prisma.listing.count({ where }) : 0,
    !kind || kind === "house" ? prisma.house.count({ where }) : 0,
    !kind || kind === "shop" ? prisma.shop.count({ where: shopWhere }) : 0,
    !kind || kind === "post" ? prisma.post.count({ where }) : 0,
    !kind || kind === "event" ? prisma.event.count({ where }) : 0,
    !kind || kind === "love" ? prisma.datingProfile.count({ where: loveWhere }) : 0,
  ]);

  const total = cArticle + cJob + cListing + cHouse + cShop + cPost + cEvent + cLove;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const skip = (Math.min(page, totalPages) - 1) * pageSize;

  // For paginated cross-model queries, fetch all with limit and sort client-side
  // Use a reasonable per-model cap to keep memory low
  const perModelLimit = pageSize * 2;

  const [articles, jobs, listings, houses, shops, posts, events, loves] = await Promise.all([
    !kind || kind === "article" ? prisma.article.findMany({ where, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
    !kind || kind === "job" ? prisma.job.findMany({ where, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
    !kind || kind === "listing" ? prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
    !kind || kind === "house" ? prisma.house.findMany({ where, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
    !kind || kind === "shop" ? prisma.shop.findMany({ where: shopWhere, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
    !kind || kind === "post" ? prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
    !kind || kind === "event" ? prisma.event.findMany({ where, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
    !kind || kind === "love" ? prisma.datingProfile.findMany({ where: loveWhere, orderBy: { createdAt: "desc" }, take: perModelLimit }) : Promise.resolve([]),
  ]);

  const all = [
    ...articles.map(mapArticle), ...jobs.map(mapJob), ...listings.map(mapListing),
    ...houses.map(mapHouse), ...shops.map(mapShop), ...posts.map(mapPost),
    ...events.map(mapEvent), ...loves.map(mapLove),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  // When filtering a single kind, use proper offset; for mixed kinds, use cursor-based skip
  const items = kind ? all.slice(skip, skip + pageSize) : all.slice(0, pageSize);

  return { items, total, page: Math.min(page, totalPages), pageSize, totalPages };
}

export async function createContent(input: {
  kind: ContentKind;
  title: string;
  company?: string;
  category?: string;
  subCategory?: string;
  itemType?: string;
  price?: string;
  priceNum?: number;
  priceUnit?: string;
  condition?: string;
  address?: string;
  contact?: string;
  contactName?: string;
  wechat?: string;
  departureTime?: string;
  fromPlace?: string;
  toPlace?: string;
  body: string;
  status: ContentStatus;
  jobType?: string;
  area?: string;
  salary?: string;
  authorId?: string;
  images?: string[];
  oldId?: string;
  companyId?: string;
}) {
  const status = statusValue(input.status);
  const item =
    input.kind === "article"
      ? await prisma.article.create({ data: { title: input.title, body: input.body, category: input.category || "life", status, authorId: input.authorId, images: input.images || [], oldId: input.oldId } })
      : input.kind === "job"
        ? await prisma.job.create({
            data: {
              title: input.title,
              company: input.company || "",
              companyNameSnapshot: input.company || "",
              companyId: input.companyId || undefined,
              contactName: input.contactName,
              contactPhone: input.contact,
              address: input.address,
              body: input.body,
              jobType: input.jobType || "fulltime",
              area: input.area || "杨林地区",
              salary: input.salary || "面议",
              status,
              authorId: input.authorId,
              images: input.images || [],
              oldId: input.oldId,
            },
          })
        : await prisma.listing.create({
            data: {
              title: input.title,
              category: input.category || "二手闲置",
              subCategory: input.subCategory,
              itemType: input.itemType || "OFFER",
              price: input.price || "面议",
              priceNum: input.priceNum,
              priceUnit: input.priceUnit || "元",
              condition: input.condition,
              area: input.area || "杨林经开区",
              address: input.address,
              contact: input.contact || "",
              contactName: input.contactName,
              wechat: input.wechat,
              departureTime: input.departureTime,
              fromPlace: input.fromPlace,
              toPlace: input.toPlace,
              body: input.body,
              status,
              authorId: input.authorId,
              images: input.images || [],
              oldId: input.oldId,
            },
          });

  await prisma.operationLog.create({
    data: {
      action: `create_${input.kind}`,
      targetId: item.id,
      metadata: {
        title: input.title,
        company: input.company || "",
        category: input.category || "",
        contact: input.contact || "",
        status: input.status,
      },
    },
  });

  if (input.kind === "article") return mapArticle(item);
  if (input.kind === "job") return mapJob(item);
  return mapListing(item);
}

export async function updateContent(
  id: string,
  status: ContentStatus,
  fields?: {
    title?: string;
    body?: string;
    company?: string;
    category?: string;
    contact?: string;
    jobType?: string;
    area?: string;
    salary?: string;
    images?: string[];
    isTop?: boolean;
    isFeatured?: boolean;
    houseType?: string;
    price?: string;
    layout?: string;
    areaSize?: string;
    location?: string;
    phone?: string;
    address?: string;
    hours?: string;
    intro?: string;
    eventTime?: string;
    fee?: string;
    quota?: string;
    board?: string;
    nickname?: string;
    gender?: string;
    birthYear?: number;
    heightCm?: number;
    education?: string;
    occupation?: string;
    income?: string;
    maritalStatus?: string;
    requirement?: string;
    subCategory?: string;
    itemType?: string;
    priceNum?: number;
    priceUnit?: string;
    condition?: string;
    contactName?: string;
    wechat?: string;
    departureTime?: string;
    fromPlace?: string;
    toPlace?: string;
    refreshedAt?: Date;
    rejectReason?: string | null;
    expiresAt?: Date | null;
    extraData?: any;
  },
) {
  const value = statusValue(status);

  try {
    const item = await prisma.article.update({
      where: { id },
      data: {
        status: value,
        ...(fields?.title !== undefined ? { title: fields.title } : {}),
        ...(fields?.body !== undefined ? { body: fields.body } : {}),
        ...(fields?.category !== undefined ? { category: fields.category } : {}),
        ...(fields?.images !== undefined ? { images: fields.images } : {}),
      },
    });
    await prisma.operationLog.create({
      data: { action: "update_article_status", targetId: id, metadata: { title: item.title, status } },
    });
    return mapArticle(item);
  } catch {
    try {
      const item = await prisma.job.update({
        where: { id },
        data: {
          status: value,
          ...(fields?.title !== undefined ? { title: fields.title } : {}),
          ...(fields?.body !== undefined ? { body: fields.body } : {}),
          ...(fields?.company !== undefined ? { company: fields.company } : {}),
          ...(fields?.jobType !== undefined ? { jobType: fields.jobType } : {}),
          ...(fields?.area !== undefined ? { area: fields.area } : {}),
          ...(fields?.salary !== undefined ? { salary: fields.salary } : {}),
          ...(fields?.images !== undefined ? { images: fields.images } : {}),
          // The administration screen uses this shared updater for pin/unpin.
          // Without this field, Job updates returned 200 but silently kept isTop.
          ...(fields?.isTop !== undefined ? { isTop: fields.isTop } : {}),
        },
      });
      await prisma.operationLog.create({
        data: { action: "update_job_status", targetId: id, metadata: { title: item.title, company: item.company, status } },
      });
      return mapJob(item);
    } catch {
      try {
        const item = await prisma.listing.update({
          where: { id },
          data: {
            status: value,
            ...(fields?.title !== undefined ? { title: fields.title } : {}),
            ...(fields?.body !== undefined ? { body: fields.body } : {}),
            ...(fields?.category !== undefined ? { category: fields.category } : {}),
            ...(fields?.subCategory !== undefined ? { subCategory: fields.subCategory } : {}),
            ...(fields?.itemType !== undefined ? { itemType: fields.itemType } : {}),
            ...(fields?.price !== undefined ? { price: fields.price } : {}),
            ...(fields?.priceNum !== undefined ? { priceNum: fields.priceNum } : {}),
            ...(fields?.priceUnit !== undefined ? { priceUnit: fields.priceUnit } : {}),
            ...(fields?.condition !== undefined ? { condition: fields.condition } : {}),
            ...(fields?.area !== undefined ? { area: fields.area } : {}),
            ...(fields?.address !== undefined ? { address: fields.address } : {}),
            ...(fields?.contact !== undefined ? { contact: fields.contact } : {}),
            ...(fields?.contactName !== undefined ? { contactName: fields.contactName } : {}),
            ...(fields?.wechat !== undefined ? { wechat: fields.wechat } : {}),
            ...(fields?.images !== undefined ? { images: fields.images } : {}),
            ...(fields?.isTop !== undefined ? { isTop: fields.isTop } : {}),
            ...(fields?.departureTime !== undefined ? { departureTime: fields.departureTime } : {}),
            ...(fields?.fromPlace !== undefined ? { fromPlace: fields.fromPlace } : {}),
            ...(fields?.toPlace !== undefined ? { toPlace: fields.toPlace } : {}),
            ...(fields?.refreshedAt !== undefined ? { refreshedAt: fields.refreshedAt } : {}),
            ...(fields?.rejectReason !== undefined ? { rejectReason: fields.rejectReason } : {}),
            ...(fields?.expiresAt !== undefined ? { expiresAt: fields.expiresAt } : {}),
            ...(fields?.isFeatured !== undefined ? { isFeatured: fields.isFeatured } : {}),
            ...(fields?.extraData !== undefined ? { extraData: fields.extraData } : {}),
          },
        });
        await prisma.operationLog.create({
          data: { action: "update_listing_status", targetId: id, metadata: { title: item.title, category: item.category, status } },
        });
        return mapListing(item);
      } catch {
        try {
          const item = await prisma.house.update({
            where: { id },
            data: {
              status: value,
              ...(fields?.title !== undefined ? { title: fields.title } : {}),
              ...(fields?.body !== undefined ? { body: fields.body } : {}),
              ...(fields?.category !== undefined ? { houseType: fields.category } : {}),
              ...(fields?.houseType !== undefined ? { houseType: fields.houseType } : {}),
              ...(fields?.price !== undefined ? { price: fields.price } : {}),
              ...(fields?.layout !== undefined ? { layout: fields.layout } : {}),
              ...(fields?.areaSize !== undefined ? { areaSize: fields.areaSize } : {}),
              ...(fields?.location !== undefined ? { location: fields.location } : {}),
              ...(fields?.contact !== undefined ? { contact: fields.contact } : {}),
              ...(fields?.images !== undefined ? { images: fields.images } : {}),
              ...(fields?.isTop !== undefined ? { isTop: fields.isTop } : {}),
            },
          });
          await prisma.operationLog.create({
            data: { action: "update_house_status", targetId: id, metadata: { title: item.title, houseType: item.houseType, status } },
          });
          return mapHouse(item);
        } catch {
          try {
            const item = await prisma.shop.update({
              where: { id },
              data: {
                status: value,
                ...(fields?.title !== undefined ? { name: fields.title } : {}),
                ...(fields?.body !== undefined ? { intro: fields.body } : {}),
                ...(fields?.intro !== undefined ? { intro: fields.intro } : {}),
                ...(fields?.category !== undefined ? { category: fields.category } : {}),
                ...(fields?.contact !== undefined ? { phone: fields.contact } : {}),
                ...(fields?.phone !== undefined ? { phone: fields.phone } : {}),
                ...(fields?.address !== undefined ? { address: fields.address } : {}),
                ...(fields?.hours !== undefined ? { hours: fields.hours } : {}),
                ...(fields?.images !== undefined ? { images: fields.images } : {}),
                ...(fields?.isTop !== undefined ? { isTop: fields.isTop } : {}),
                ...(fields?.isFeatured !== undefined ? { isFeatured: fields.isFeatured } : {}),
              },
            });
            await prisma.operationLog.create({
              data: { action: "update_shop_status", targetId: id, metadata: { name: item.name, category: item.category, status } },
            });
            return mapShop(item);
          } catch {
            try {
              const item = await prisma.post.update({
                where: { id },
                data: {
                  status: value,
                  ...(fields?.title !== undefined ? { title: fields.title } : {}),
                  ...(fields?.body !== undefined ? { body: fields.body } : {}),
                  ...(fields?.category !== undefined ? { board: fields.category } : {}),
                  ...(fields?.board !== undefined ? { board: fields.board } : {}),
                  ...(fields?.images !== undefined ? { images: fields.images } : {}),
                  ...(fields?.isTop !== undefined ? { isTop: fields.isTop } : {}),
                },
              });
              await prisma.operationLog.create({
                data: { action: "update_post_status", targetId: id, metadata: { title: item.title, board: item.board, status } },
              });
              return mapPost(item);
            } catch {
              try {
                const item = await prisma.event.update({
                  where: { id },
                  data: {
                    status: value,
                    ...(fields?.title !== undefined ? { title: fields.title } : {}),
                    ...(fields?.body !== undefined ? { intro: fields.body } : {}),
                    ...(fields?.intro !== undefined ? { intro: fields.intro } : {}),
                    ...(fields?.category !== undefined ? { category: fields.category } : {}),
                    ...(fields?.contact !== undefined ? { contact: fields.contact } : {}),
                    ...(fields?.eventTime !== undefined ? { eventTime: fields.eventTime } : {}),
                    ...(fields?.location !== undefined ? { location: fields.location } : {}),
                    ...(fields?.fee !== undefined ? { fee: fields.fee } : {}),
                    ...(fields?.quota !== undefined ? { quota: fields.quota } : {}),
                    ...(fields?.images !== undefined ? { images: fields.images } : {}),
                    ...(fields?.isTop !== undefined ? { isTop: fields.isTop } : {}),
                  },
                });
                await prisma.operationLog.create({
                  data: { action: "update_event_status", targetId: id, metadata: { title: item.title, category: item.category, status } },
                });
                return mapEvent(item);
              } catch {
                try {
                  const item = await prisma.datingProfile.update({
                    where: { id },
                    data: {
                      status: value,
                      ...(fields?.title !== undefined ? { nickname: fields.title } : {}),
                      ...(fields?.nickname !== undefined ? { nickname: fields.nickname } : {}),
                      ...(fields?.body !== undefined ? { intro: fields.body } : {}),
                      ...(fields?.intro !== undefined ? { intro: fields.intro } : {}),
                      ...(fields?.category !== undefined ? { gender: fields.category } : {}),
                      ...(fields?.gender !== undefined ? { gender: fields.gender } : {}),
                      ...(fields?.contact !== undefined ? { contact: fields.contact } : {}),
                      ...(fields?.birthYear !== undefined ? { birthYear: fields.birthYear } : {}),
                      ...(fields?.heightCm !== undefined ? { heightCm: fields.heightCm } : {}),
                      ...(fields?.education !== undefined ? { education: fields.education } : {}),
                      ...(fields?.occupation !== undefined ? { occupation: fields.occupation } : {}),
                      ...(fields?.income !== undefined ? { income: fields.income } : {}),
                      ...(fields?.maritalStatus !== undefined ? { maritalStatus: fields.maritalStatus } : {}),
                      ...(fields?.requirement !== undefined ? { requirement: fields.requirement } : {}),
                    },
                  });
                  await prisma.operationLog.create({
                    data: { action: "update_love_status", targetId: id, metadata: { nickname: item.nickname, gender: item.gender, status } },
                  });
                  return mapLove(item);
                } catch {
                  return null;
                }
              }
            }
          }
        }
      }
    }
  }
}

export async function deleteContent(id: string) {
  try {
    const item = await prisma.article.delete({ where: { id } });
    await prisma.operationLog.create({ data: { action: "delete_article", targetId: id, metadata: { title: item.title } } });
    return mapArticle(item);
  } catch {
    try {
      const item = await prisma.job.delete({ where: { id } });
      await prisma.operationLog.create({ data: { action: "delete_job", targetId: id, metadata: { title: item.title, company: item.company } } });
      return mapJob(item);
    } catch {
      try {
        const item = await prisma.listing.delete({ where: { id } });
        await prisma.operationLog.create({
          data: { action: "delete_listing", targetId: id, metadata: { title: item.title, category: item.category } },
        });
        return mapListing(item);
      } catch {
        try {
          const item = await prisma.house.delete({ where: { id } });
          await prisma.operationLog.create({
            data: { action: "delete_house", targetId: id, metadata: { title: item.title, houseType: item.houseType } },
          });
          return mapHouse(item);
        } catch {
          try {
            const item = await prisma.shop.delete({ where: { id } });
            await prisma.operationLog.create({
              data: { action: "delete_shop", targetId: id, metadata: { name: item.name, category: item.category } },
            });
            return mapShop(item);
          } catch {
            try {
              const item = await prisma.post.delete({ where: { id } });
              await prisma.operationLog.create({
                data: { action: "delete_post", targetId: id, metadata: { title: item.title, board: item.board } },
              });
              return mapPost(item);
            } catch {
              try {
                const item = await prisma.event.delete({ where: { id } });
                await prisma.operationLog.create({
                  data: { action: "delete_event", targetId: id, metadata: { title: item.title, category: item.category } },
                });
                return mapEvent(item);
              } catch {
                try {
                  const item = await prisma.datingProfile.delete({ where: { id } });
                  await prisma.operationLog.create({
                    data: { action: "delete_love", targetId: id, metadata: { nickname: item.nickname, gender: item.gender } },
                  });
                  return mapLove(item);
                } catch {
                  return null;
                }
              }
            }
          }
        }
      }
    }
  }
}

export async function deleteBrowserTestContent() {
  const [articles, jobs, listings] = await Promise.all([
    prisma.article.findMany({ where: { title: { startsWith: "浏览器验证" } }, select: { id: true, title: true } }),
    prisma.job.findMany({ where: { title: { startsWith: "浏览器验证" } }, select: { id: true, title: true } }),
    prisma.listing.findMany({ where: { title: { startsWith: "浏览器验证" } }, select: { id: true, title: true } }),
  ]);

  const [deletedArticles, deletedJobs, deletedListings] = await prisma.$transaction([
    prisma.article.deleteMany({ where: { id: { in: articles.map((item) => item.id) } } }),
    prisma.job.deleteMany({ where: { id: { in: jobs.map((item) => item.id) } } }),
    prisma.listing.deleteMany({ where: { id: { in: listings.map((item) => item.id) } } }),
    prisma.operationLog.create({
      data: {
        action: "cleanup_browser_test_content",
        metadata: {
          articles: articles.map((item) => item.title),
          jobs: jobs.map((item) => item.title),
          listings: listings.map((item) => item.title),
        },
      },
    }),
  ]);

  return { articles: deletedArticles.count, jobs: deletedJobs.count, listings: deletedListings.count };
}
