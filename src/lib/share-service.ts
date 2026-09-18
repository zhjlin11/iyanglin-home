import { prisma } from "@/lib/prisma";
import { cleanText, stripHtml, extractImageUrls } from "@/lib/strip-html";
import { parseJobBody } from "@/lib/job-parser";
import { parseHouseBody } from "@/lib/house-parser";
import { parseShopBody } from "@/lib/shop-parser";
import { parseActivityBody } from "@/lib/activity-parser";

export type SupportedResourceType =
  | "JOB"
  | "HOUSE"
  | "INDUSTRIAL"
  | "COMMUNITY_POST"
  | "MERCHANT"
  | "ARTICLE"
  | "PRODUCT"
  | "DATING"
  | "EVENT";

export interface ShareMetadata {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  resourceType: SupportedResourceType;
  resourceId: string;
}

const BASE_URL = "https://iyanglin.com";

function ensureAbsoluteHttpsUrl(pathOrUrl: string | null | undefined, fallback: string): string {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return fallback;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) {
      return fallback;
    }
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  const cleanPath = trimmed.replace(/^(\.\.\/|\.\/|\\)+/, "").replace(/\\/g, "/");
  const leadingSlash = cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath;
  return `${BASE_URL}${leadingSlash}`;
}

const SHARE_VER = "v=20260912";

export const CHANNEL_SHARE_IMAGES: Record<SupportedResourceType, string> = {
  JOB: `${BASE_URL}/share/v2/job.png?${SHARE_VER}`,
  HOUSE: `${BASE_URL}/share/v2/house.png?${SHARE_VER}`,
  INDUSTRIAL: `${BASE_URL}/share/v2/industrial.png?${SHARE_VER}`,
  COMMUNITY_POST: `${BASE_URL}/share/v2/community.png?${SHARE_VER}`,
  MERCHANT: `${BASE_URL}/share/v2/merchant.png?${SHARE_VER}`,
  ARTICLE: `${BASE_URL}/share/v2/article.png?${SHARE_VER}`,
  PRODUCT: `${BASE_URL}/share/v2/product.png?${SHARE_VER}`,
  DATING: `${BASE_URL}/share/v2/default.png?${SHARE_VER}`,
  EVENT: `${BASE_URL}/share/v2/default.png?${SHARE_VER}`,
};

export async function getResourceShareMetadata(
  resourceType: SupportedResourceType | string,
  resourceId: string
): Promise<ShareMetadata | null> {
  const normType = String(resourceType).toUpperCase() as SupportedResourceType;
  const id = String(resourceId).trim();

  const defaultImg = CHANNEL_SHARE_IMAGES[normType] || `${BASE_URL}/share/v2/default.png?${SHARE_VER}`;

  try {
    switch (normType) {
      case "JOB": {
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return null;
        const parsed = parseJobBody(job.body);
        const title = `【招聘】${parsed.jobTitle || job.title} - ${job.company || "杨林优质企业"}`;
        const descText = `${job.company || "杨林企业"}诚聘${parsed.jobTitle || job.title}，薪资：${parsed.salary || job.salary || "面议"}，地点：${parsed.area || job.area || "杨林镇"}。立即查看岗位与联系电话。`;
        const firstImg = (job.images && job.images[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/jobs/${job.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: job.id,
        };
      }

      case "HOUSE": {
        const house = await prisma.house.findUnique({ where: { id } });
        if (!house) return null;
        const parsed = parseHouseBody(house.body);
        const typeLabel = parsed.houseType || "精选房产";
        const title = `【${typeLabel}】${cleanText(house.title)}`;
        const descText = `租售价位：${parsed.price || house.price || "面议"}，居室户型：${parsed.layout || house.layout || "精选户型"}，位置：${parsed.location || house.location || "嵩明杨林"}。真实房东直通，欢迎垂询。`;
        const firstImg = (house.images && house.images[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/house/${house.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: house.id,
        };
      }

      case "INDUSTRIAL": {
        const item = await prisma.industrialProperty.findUnique({ where: { id } });
        if (!item) return null;
        const typeName =
          item.propertyType === "FACTORY"
            ? "厂房"
            : item.propertyType === "WAREHOUSE"
            ? "仓库"
            : item.propertyType === "LAND"
            ? "工业土地"
            : item.propertyType === "OFFICE"
            ? "办公楼"
            : "园区物业";
        const areaStr = item.buildingArea ? `${item.buildingArea}㎡` : item.landArea ? `${item.landArea}亩` : "";
        const title = `【园区招商】${item.title} - ${item.region}${typeName}直租`;
        const descText = `${item.region}${item.title}，面积：${areaStr}，租售价格：${item.negotiable ? "面议" : `${item.rentPrice || item.salePrice || "面议"} ${item.priceUnit}`}。杨林经开区真实园区直通。`;
        const firstImg = (item.images && item.images[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/industrial/${item.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: item.id,
        };
      }

      case "COMMUNITY_POST": {
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return null;
        const title = `【杨林社区】${cleanText(post.title)}`;
        const descText = stripHtml(post.body).slice(0, 100) || "来自杨林生活网同城社区论坛的精彩讨论，点击进入查看详情与参与互动。";
        const firstImg = (post.images && post.images[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/community/${post.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: post.id,
        };
      }

      case "MERCHANT": {
        const shop = await prisma.shop.findUnique({ where: { id } });
        if (!shop) return null;
        const parsed = parseShopBody(shop.intro);
        const title = `【好店名录】${shop.name} - 杨林口碑好店`;
        const descText = `主营特色：${parsed.services || "同城生活服务"}，地址：${parsed.address || shop.address || "杨林镇"}。欢迎光临与在线咨询！`;
        const firstImg = shop.logo || (shop.images && shop.images[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/haodian/${shop.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: shop.id,
        };
      }

      case "ARTICLE": {
        let article = await prisma.article.findUnique({ where: { id } });
        if (!article) {
          article = await prisma.article.findFirst({ where: { oldId: id } });
        }
        if (!article) {
          if (id === "user-agreement") {
            return {
              title: "杨林生活网用户服务协议 - 官方服务",
              description: "杨林生活网用户服务协议，规范平台使用与保障用户合法权益。",
              url: `${BASE_URL}/articles/user-agreement`,
              imageUrl: defaultImg,
              resourceType: normType,
              resourceId: id,
            };
          }
          if (id === "privacy-policy") {
            return {
              title: "杨林生活网隐私保护指引 - 官方服务",
              description: "杨林生活网隐私保护指引与个人信息处理规则，严格保障您的个人隐私安全。",
              url: `${BASE_URL}/articles/privacy-policy`,
              imageUrl: defaultImg,
              resourceType: normType,
              resourceId: id,
            };
          }
          return null;
        }
        const title = `${article.title} - 杨林生活网资讯`;
        const descText = stripHtml(article.body).slice(0, 100) || "杨林生活网本地民生通告、生活服务与最新资讯。";
        const contentImgs = extractImageUrls(article.body);
        const firstImg = (article.images && article.images[0]) || contentImgs[0] || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/articles/${article.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: article.id,
        };
      }

      case "PRODUCT": {
        const listing = await prisma.listing.findUnique({ where: { id } });
        if (!listing) return null;
        const title = `【同城优选】${listing.title}`;
        const descText = stripHtml(listing.body).slice(0, 100) || "杨林生活网同城精选优质物品与便民信息，真实可靠，欢迎了解详情。";
        const firstImg = (listing.images && listing.images[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/info/${listing.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: listing.id,
        };
      }

      case "DATING": {
        const dating = await prisma.datingProfile.findUnique({ where: { id } });
        if (!dating) return null;
        const age = new Date().getFullYear() - (dating.birthYear || 1995);
        const genderText = dating.gender === "female" ? "女嘉宾" : "男嘉宾";
        const title = `【同城相亲】${dating.nickname} (${genderText} · ${age}岁) - 杨林单身交友`;
        const descText = `杨林单身嘉宾 ${dating.nickname}，${age}岁，学历：${dating.education || "本科"}，职业：${dating.occupation || "职员"}。点击查看征婚资料与牵线联系。`;
        const firstImg = (dating.photos && dating.photos[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/love/${dating.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: dating.id,
        };
      }

      case "EVENT": {
        const ev = await prisma.event.findUnique({ where: { id } });
        if (!ev) return null;
        const parsed = parseActivityBody(ev.intro);
        const title = `【同城活动】${ev.title} - 杨林生活网`;
        const descText = `活动地点：${parsed.location || ev.location || "杨林"}。时间：${ev.eventTime || "见详情"}。立即报名参与同城精彩活动。`;
        const firstImg = (ev.images && ev.images[0]) || null;
        return {
          title,
          description: descText,
          url: `${BASE_URL}/active/${ev.id}`,
          imageUrl: ensureAbsoluteHttpsUrl(firstImg, defaultImg),
          resourceType: normType,
          resourceId: ev.id,
        };
      }

      default:
        return null;
    }
  } catch (err) {
    console.error(`[ShareService] Failed to get share metadata for ${normType}:${id}`, err);
    return null;
  }
}
