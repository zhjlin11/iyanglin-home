import { prisma } from "@/lib/prisma";
import { invokeAi } from "@/lib/ai-service";
import {
  classifyAssistantIntent,
  type AssistantIntentDecision,
  type AssistantIntentType,
} from "@/lib/assistant-intent-router";

export interface CleanedResourceCard {
  id: string;
  type: "JOB" | "HOUSE" | "INDUSTRIAL" | "SERVICE" | "PROVIDER" | "LISTING" | "SHOP" | "COMMUNITY";
  badgeText: string;
  title: string;
  price?: string;
  subTitle?: string;
  highlightMeta?: string;
  location?: string;
  url: string;
  actionText: string;
}

export interface AssistantProcessResult {
  reply: string;
  isFallback: boolean;
  totalMatches: number;
  moreUrl?: string;
  moreText?: string;
  resources: CleanedResourceCard[];
  suggestedFollowUps: string[];
  intent: AssistantIntentDecision;
  conversationTitle?: string;
}

/**
 * 内部枚举与技术 slug 转换字典：转换为人类友好的简体中文
 */
const ENUM_MAP: Record<string, string> = {
  rent: "出租",
  secondhand: "二手房",
  newhouse: "新房",
  shop: "商铺转租",
  RENT: "出租",
  SALE: "出售",
  fulltime: "全职",
  parttime: "兼职",
  intern: "实习",
  FACTORY: "标准厂房",
  WAREHOUSE: "仓储物流库",
  LAND: "工业用地",
  OFFICE: "园区办公楼",
  food: "餐饮美食",
  entertainment: "休闲娱乐",
  digital: "数码电脑",
  used: "二手回收",
  mobile: "同城上门",
  "杨林全境": "杨林全域及周边",
};

export function translateEnum(val?: string | null): string {
  if (!val) return "";
  const trimmed = val.trim();
  return ENUM_MAP[trimmed] || ENUM_MAP[trimmed.toLowerCase()] || trimmed;
}

export function cleanPriceDisplay(rawPrice?: string | number | null, unit: string = ""): string | undefined {
  if (rawPrice === null || rawPrice === undefined) return undefined;
  const str = String(rawPrice).trim();
  if (!str) return undefined;
  if (str === "面议" || str === "暂无" || str === "免费" || str === "0") return "面议";
  if (str.startsWith("¥") || str.startsWith("￥")) return str;
  return `¥${str}${unit ? (str.includes(unit) ? "" : unit) : ""}`;
}

export function cleanLocationDisplay(rawLocation?: string | null): string {
  if (!rawLocation) return "杨林本地";
  const trimmed = rawLocation.trim();
  if (trimmed.toLowerCase() === "mobile") return "同城上门";
  if (trimmed === "杨林全境") return "杨林全域及周边";
  return trimmed;
}

function formatRelativeTime(date?: Date | null): string {
  if (!date) return "近期";
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return "近期更新";
}

export function generateSmartConversationTitle(message: string, intentDecision: AssistantIntentDecision): string {
  const cleanMsg = message.replace(/[？?！!。，, ]/g, " ").trim();

  if (intentDecision.intent === "JOB_SEARCH") {
    const kw = intentDecision.entities.keyword || "";
    return `经开区${kw ? kw + "招聘" : "求职招聘"}`;
  }
  if (intentDecision.intent === "HOUSE_SEARCH") {
    return "大学城房产租赁";
  }
  if (intentDecision.intent === "INDUSTRIAL_SEARCH") {
    return "经开区厂房仓储";
  }
  if (intentDecision.intent === "SERVICE_SEARCH") {
    return intentDecision.entities.category ? `杨林${intentDecision.entities.category}` : "杨林本地便民师傅";
  }
  if (intentDecision.intent === "NAVIGATION") {
    return intentDecision.entities.navTarget?.channelName || "频道导航";
  }
  if (intentDecision.intent === "SMALL_TALK") {
    return "本地向导咨询";
  }

  const words = cleanMsg.slice(0, 16);
  return words || "本地便民咨询";
}

export function generateDynamicFollowUps(message: string, intentDecision: AssistantIntentDecision): string[] {
  const lowerMsg = message.toLowerCase();

  switch (intentDecision.intent) {
    case "JOB_SEARCH":
      if (lowerMsg.includes("兼职") || lowerMsg.includes("日结") || lowerMsg.includes("小时工")) {
        return ["大学城附近日结", "周末兼职岗位", "餐饮寒暑假工", "查看全部兼职"];
      }
      return ["只看包吃住", "工资6000以上", "只看有五险", "查看全部岗位"];

    case "HOUSE_SEARCH":
      if (lowerMsg.includes("合租") || lowerMsg.includes("单间")) {
        return ["预算1200以内", "大学城附近", "只看一室", "只看个人房源"];
      }
      if (lowerMsg.includes("整租") || lowerMsg.includes("两室") || lowerMsg.includes("三室")) {
        return ["俊发空港城整租", "预算2000以内", "只看精装带燃气", "查看全部整租房"];
      }
      return ["预算1200以内", "大学城附近", "只看一室", "只看个人房源"];

    case "INDUSTRIAL_SEARCH":
      return ["标准厂房带行车", "1000平米以上", "只看独门独院", "查看全部厂房"];

    case "SERVICE_SEARCH":
      return ["只看上门服务", "查看联系电话", "同城水电疏通", "发布维修需求"];

    case "INFO_SEARCH":
      if (lowerMsg.includes("拼车") || lowerMsg.includes("顺风车")) {
        return ["杨林到昆明拼车", "长水机场顺风车", "北部客运站拼车", "查看全部拼车"];
      }
      return ["二手电动车", "二手闲置数码", "同城拼车顺风车", "发布便民分类"];

    case "MERCHANT_SEARCH":
      return ["职教园区特色小吃", "杨林本地酸菜牛肉", "附近高评分餐馆", "查看全部商家"];

    case "COMMUNITY_SEARCH":
      return ["本地最新热帖", "大学城避坑讨论", "经开区生活吐槽", "发布社区新帖"];

    case "NAVIGATION":
      return ["查看求职招聘", "查看房产楼市", "查看园区厂房", "查看便民服务"];

    case "SMALL_TALK":
    default:
      return ["经开区月薪5000+包吃住", "大学城附近租房", "园区1000平标准厂房", "上门水电维修"];
  }
}

/**
 * 核心处理逻辑：
 * 意图识别 -> 严格域名隔离检索 -> 拒绝便民兜底 -> 真实数量统计 -> 结构化回答
 */
export async function processAssistantMessage(params: {
  message: string;
  userId?: string;
  conversationId?: string;
  isFirstMessage?: boolean;
}): Promise<AssistantProcessResult> {
  const { message, userId } = params;

  // 1. 结构化意图识别与槽位提取
  const intentDecision = classifyAssistantIntent(message);
  const { intent, entities } = intentDecision;

  const resources: CleanedResourceCard[] = [];
  let totalMatches = 0;
  let moreUrl: string | undefined = undefined;
  let moreText: string | undefined = undefined;
  let reply = "";
  let isFallback = false;

  // ==================== 场景 A: 闲聊 (SMALL_TALK) ====================
  // 铁律：绝不查库、绝不推荐卡片、绝不伪造匹配数
  if (intent === "SMALL_TALK") {
    totalMatches = 0;
    const lower = message.toLowerCase().trim();

    if (lower.includes("你是谁") || lower.includes("你叫什么") || lower.includes("介绍") || lower.includes("功能")) {
      reply = "您好！我是杨林生活网本地智能助手。我已直连杨林经开区、大学城及嵩明全域真实生活数据。您可以随时问我经开区大厂招聘、大学城周边租房、园区标准厂房、本地水电开锁师傅上门等信息！";
    } else if (lower.includes("谢谢") || lower.includes("感谢") || lower.includes("多谢")) {
      reply = "不客气！能帮到您是我的荣幸。如果您在杨林本地还有找工作、租房或找师傅的需求，随时告诉我！";
    } else if (lower.includes("再见") || lower.includes("拜拜") || lower.includes("88")) {
      reply = "再见！祝您在杨林生活和工作愉快，随时欢迎您再次咨询。";
    } else {
      reply = "您好！我是杨林生活助手，很高兴为您服务。请问您今天想找工作、租房、看厂房，还是预约本地便民师傅？";
    }

    const suggestedFollowUps = generateDynamicFollowUps(message, intentDecision);
    const conversationTitle = generateSmartConversationTitle(message, intentDecision);

    return {
      reply,
      isFallback: false,
      totalMatches: 0,
      resources: [],
      suggestedFollowUps,
      intent: intentDecision,
      conversationTitle,
    };
  }

  // ==================== 场景 B: 导航跳转 (NAVIGATION) ====================
  // 铁律：直接给出目标频道说明与直达通道，不执行无意义的内容检索
  if (intent === "NAVIGATION" && entities.navTarget) {
    const target = entities.navTarget;
    totalMatches = 0;
    moreUrl = target.url;
    moreText = target.buttonText;
    reply = `您可以前往杨林生活网【${target.channelName}】。\n\n${target.description}\n\n点击下方专属快捷通道即可直接进入浏览全部信息。`;

    const suggestedFollowUps = generateDynamicFollowUps(message, intentDecision);
    const conversationTitle = generateSmartConversationTitle(message, intentDecision);

    return {
      reply,
      isFallback: false,
      totalMatches: 0,
      moreUrl,
      moreText,
      resources: [],
      suggestedFollowUps,
      intent: intentDecision,
      conversationTitle,
    };
  }

  // ==================== 场景 C: 未知或低置信度 (UNKNOWN) ====================
  // 铁律：宁可向用户礼貌提问澄清意图，绝不默认落入便民大厅
  if (intent === "UNKNOWN") {
    totalMatches = 0;
    reply =
      "您好，我暂时未能完全确定您的查询意向。为了给您提供精准的本地真实信息，请问您是希望：\n\n" +
      "1. 💼 **求职找工作**（经开区普工、操作工、文员、日结等）；\n" +
      "2. 🏠 **房屋租赁**（大学城单间、整租、合租等）；\n" +
      "3. 🏭 **园区厂房**（标准厂房、带行车库房、工业用地等）；\n" +
      "4. 🔧 **找上门师傅**（水电维修、管道疏通、开锁等）；\n" +
      "5. 📦 **同城便民**（拼车顺风车、二手闲置、宠物等）。\n\n" +
      "您可以直接点击下方的快捷标签或重新输入更具体的描述哦！";

    const suggestedFollowUps = ["经开区月薪5000+包吃住", "大学城附近租房", "园区1000平标准厂房", "上门水电维修"];
    const conversationTitle = "便民智能向导";

    return {
      reply,
      isFallback: false,
      totalMatches: 0,
      resources: [],
      suggestedFollowUps,
      intent: intentDecision,
      conversationTitle,
    };
  }

  // ==================== 场景 D: 求职招聘 (JOB_SEARCH) ====================
  // 铁律：仅允许查询 Job 表，严禁跨表查询便民/房产
  if (intent === "JOB_SEARCH") {
    const whereCondition: any = {
      status: "APPROVED",
    };

    const andConditions: any[] = [];

    // 区域约束
    if (entities.region) {
      andConditions.push({ area: { contains: entities.region } });
    }

    // 工种同义词检索（如普工 -> 普工/操作工/生产工/车间工人/包装工）
    if (entities.jobSynonyms && entities.jobSynonyms.length > 0) {
      andConditions.push({
        OR: entities.jobSynonyms.flatMap((syn) => [
          { title: { contains: syn, mode: "insensitive" } },
          { body: { contains: syn, mode: "insensitive" } },
        ]),
      });
    } else if (entities.keyword && entities.keyword.trim()) {
      const kw = entities.keyword.trim();
      andConditions.push({
        OR: [
          { title: { contains: kw, mode: "insensitive" } },
          { company: { contains: kw, mode: "insensitive" } },
          { body: { contains: kw, mode: "insensitive" } },
        ],
      });
    }

    // 福利待遇约束 (包吃住, 五险, etc.)
    if (entities.benefits && entities.benefits.length > 0) {
      for (const benefit of entities.benefits) {
        andConditions.push({
          OR: [
            { title: { contains: benefit, mode: "insensitive" } },
            { body: { contains: benefit, mode: "insensitive" } },
          ],
        });
      }
    }

    // 工作性质
    if (entities.jobType === "parttime") {
      andConditions.push({
        OR: [
          { jobType: "parttime" },
          { title: { contains: "兼职" } },
          { title: { contains: "日结" } },
          { body: { contains: "兼职" } },
          { body: { contains: "日结" } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereCondition.AND = andConditions;
    }

    totalMatches = await prisma.job.count({ where: whereCondition });
    const jobs = await prisma.job.findMany({
      where: whereCondition,
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    jobs.forEach((j) => {
      const perksDisplay = j.jobType === "parttime" ? "兼职日结" : "全职岗位";
      resources.push({
        id: j.id,
        type: "JOB",
        badgeText: "💼 招聘",
        title: j.title,
        price: cleanPriceDisplay(j.salary, "/月") || "薪资面议",
        subTitle: j.company || "经开区直招企业",
        highlightMeta: `${perksDisplay} · ${formatRelativeTime(j.createdAt)}`,
        location: cleanLocationDisplay(j.area),
        url: `/jobs/${j.id}`,
        actionText: "查看职位 >",
      });
    });

    moreUrl = `/jobs${entities.keyword ? `?q=${encodeURIComponent(entities.keyword)}` : ""}`;
    moreText = totalMatches > 0 ? `查看全部 ${totalMatches} 条招聘岗位 >` : "前往求职招聘大厅 >";

    if (totalMatches === 0) {
      reply = `目前杨林生活网暂未找到完全符合“${message}”条件的招聘岗位。\n\n建议您：\n1. 尝试放宽薪资或福利筛选词再次查询；\n2. 前往求职招聘大厅浏览经开区各企业发布的最新直聘岗位；\n3. 在平台免费发布个人求职简历，以便招聘方主动联系您。`;
    }
  }

  // ==================== 场景 E: 房产租售 (HOUSE_SEARCH) ====================
  // 铁律：仅允许查询 House 表
  else if (intent === "HOUSE_SEARCH") {
    const whereCondition: any = {
      status: "APPROVED",
    };

    const andConditions: any[] = [];

    if (entities.region) {
      andConditions.push({ location: { contains: entities.region } });
    }
    if (entities.houseType) {
      andConditions.push({ houseType: entities.houseType });
    }
    if (entities.layout) {
      andConditions.push({ layout: { contains: entities.layout } });
    }

    if (andConditions.length > 0) {
      whereCondition.AND = andConditions;
    }

    totalMatches = await prisma.house.count({ where: whereCondition });
    const houses = await prisma.house.findMany({
      where: whereCondition,
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    houses.forEach((h) => {
      const typeLabel = translateEnum(h.houseType);
      const layoutLabel = h.layout && h.layout !== "不限" ? h.layout : "品质户型";
      const areaLabel = h.areaSize && h.areaSize !== "不限" ? `${h.areaSize}㎡` : "标准面积";

      resources.push({
        id: h.id,
        type: "HOUSE",
        badgeText: "🏠 房产",
        title: h.title,
        price: cleanPriceDisplay(h.price, h.houseType === "rent" ? "元/月" : "万元"),
        subTitle: `${layoutLabel} · ${areaLabel}`,
        highlightMeta: `${typeLabel} · ${formatRelativeTime(h.createdAt)}`,
        location: cleanLocationDisplay(h.location),
        url: `/house/${h.id}`,
        actionText: "查看房源 >",
      });
    });

    moreUrl = `/house`;
    moreText = totalMatches > 0 ? `查看全部 ${totalMatches} 套房源信息 >` : "前往房产楼市频道 >";

    if (totalMatches === 0) {
      reply = `目前杨林生活网暂未找到完全符合“${message}”条件的房源信息。\n\n建议您调整预算或户型范围，或前往房产楼市频道浏览大学城及周边更多房源。`;
    }
  }

  // ==================== 场景 F: 园区工业厂房 (INDUSTRIAL_SEARCH) ====================
  // 铁律：仅允许查询 IndustrialProperty 表，严格支持“带行车”硬条件
  else if (intent === "INDUSTRIAL_SEARCH") {
    const whereCondition: any = {
      status: "PUBLISHED",
    };

    const andConditions: any[] = [];

    if (entities.region) {
      andConditions.push({
        OR: [
          { region: { contains: entities.region } },
          { parkName: { contains: entities.region } },
          { address: { contains: entities.region } },
        ],
      });
    }

    // 行车硬过滤：若用户指明“带行车”，必须具有行车属性或正文/标题有行车说明
    if (entities.hasCrane) {
      andConditions.push({
        OR: [
          { hasCrane: true },
          { title: { contains: "行车" } },
          { description: { contains: "行车" } },
          { title: { contains: "起吊" } },
          { description: { contains: "起吊" } },
        ],
      });
    }

    if (entities.factoryAreaMin) {
      andConditions.push({
        OR: [
          { buildingArea: { gte: entities.factoryAreaMin } },
          { factoryArea: { gte: entities.factoryAreaMin } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereCondition.AND = andConditions;
    }

    totalMatches = await prisma.industrialProperty.count({ where: whereCondition });
    const industrials = await prisma.industrialProperty.findMany({
      where: whereCondition,
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    industrials.forEach((ind) => {
      const areaText = ind.buildingArea ? `${ind.buildingArea}㎡` : ind.factoryArea ? `${ind.factoryArea}㎡` : "标准厂房";
      resources.push({
        id: ind.id,
        type: "INDUSTRIAL",
        badgeText: "🏭 厂房",
        title: ind.title,
        price: ind.rentPrice ? `¥${ind.rentPrice}元/㎡/月` : "面议",
        subTitle: `${ind.parkName || "杨林经开区园区"} · 可办环评消防`,
        highlightMeta: `${ind.hasCrane ? "带行车 · " : ""}${areaText}`,
        location: cleanLocationDisplay(ind.address || ind.region),
        url: `/industrial/${ind.id}`,
        actionText: "查看厂房 >",
      });
    });

    moreUrl = `/industrial`;
    moreText = totalMatches > 0 ? `查看全部 ${totalMatches} 个园区厂房房源 >` : "前往园区厂房专区 >";

    if (totalMatches === 0) {
      reply = `杨林经开区园区暂未匹配到完全符合“${message}”要求的标准厂房。\n\n建议您放宽面积或设施要求，或前往园区厂房专区浏览更多厂房与工业用地。`;
    }
  }

  // ==================== 场景 G: 上门便民服务与师傅 (SERVICE_SEARCH) ====================
  // 铁律：优先查询 ServiceProduct 与 ServiceProvider
  else if (intent === "SERVICE_SEARCH") {
    const whereCond: any = {
      status: "ACTIVE",
      ...(entities.category ? { category: { contains: entities.category } } : {}),
      ...(entities.keyword ? { title: { contains: entities.keyword, mode: "insensitive" } } : {}),
    };

    totalMatches = await prisma.serviceProduct.count({ where: whereCond });
    const products = await prisma.serviceProduct.findMany({
      where: whereCond,
      include: { provider: true },
      take: 3,
    });

    products.forEach((p) => {
      resources.push({
        id: p.id,
        type: "SERVICE",
        badgeText: "🔧 服务",
        title: p.title,
        price: `¥${(p.priceCents / 100).toFixed(0)}起`,
        subTitle: `${p.provider.name} · 已完成 ${p.provider.completedOrders} 单`,
        highlightMeta: `${translateEnum(p.category)} · 平台质保`,
        location: "同城上门",
        url: `/services/${p.id}`,
        actionText: "预约服务 >",
      });
    });

    if (resources.length === 0) {
      const provCond: any = {
        verificationStatus: "APPROVED",
        operatingStatus: "OPEN",
        ...(entities.category ? { serviceCategory: { contains: entities.category } } : {}),
      };
      const provCount = await prisma.serviceProvider.count({ where: provCond });
      totalMatches = provCount;
      const providers = await prisma.serviceProvider.findMany({
        where: provCond,
        take: 3,
      });

      providers.forEach((prov) => {
        resources.push({
          id: prov.id,
          type: "PROVIDER",
          badgeText: "🔧 师傅",
          title: `${prov.name}（${prov.serviceCategory}）`,
          price: "可预约",
          subTitle: `认证师傅 · 好评率 ${(prov.ratingAvg * 20).toFixed(0)}%`,
          highlightMeta: "持证上门 · 价格透明",
          location: cleanLocationDisplay(prov.serviceAreas?.[0] || "杨林全域"),
          url: `/provider/${prov.id}`,
          actionText: "立即联系 >",
        });
      });
    }

    moreUrl = `/services`;
    moreText = totalMatches > 0 ? `查看全部 ${totalMatches} 位便民维修师傅 >` : "前往便民服务大厅 >";

    if (totalMatches === 0) {
      reply = `目前杨林本地便民服务中暂未找到与“${message}”完全匹配的在架服务商品或认证师傅。\n\n建议您在便民服务大厅直接提交上门需求，平台会指派就近师傅与您联系。`;
    }
  }

  // ==================== 场景 H: 纯便民与二手交易 (INFO_SEARCH) ====================
  // 铁律：仅允许查询 Listing 表（二手、拼车、转让等），绝不作为招聘/房产的垃圾桶
  else if (intent === "INFO_SEARCH") {
    const whereCondition: any = {
      status: "APPROVED",
      ...(entities.category ? { category: { contains: entities.category } } : {}),
      ...(entities.keyword ? { title: { contains: entities.keyword, mode: "insensitive" } } : {}),
    };

    totalMatches = await prisma.listing.count({ where: whereCondition });
    const listings = await prisma.listing.findMany({
      where: whereCondition,
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    listings.forEach((l) => {
      resources.push({
        id: l.id,
        type: "LISTING",
        badgeText: "📦 便民",
        title: l.title,
        price: cleanPriceDisplay(l.price),
        subTitle: `${translateEnum(l.category)} · 发布于 ${cleanLocationDisplay(l.area)}`,
        highlightMeta: formatRelativeTime(l.createdAt),
        location: cleanLocationDisplay(l.area),
        url: `/info/${l.id}`,
        actionText: "查看详情 >",
      });
    });

    moreUrl = `/info`;
    moreText = totalMatches > 0 ? `查看全部 ${totalMatches} 条便民分类信息 >` : "前往便民分类大厅 >";

    if (totalMatches === 0) {
      reply = `杨林生活网便民大厅暂未检索到关于“${message}”的最新发布贴。\n\n建议您尝试缩短关键词，或在便民大厅免费发帖求助。`;
    }
  }

  // ==================== 场景 I: 口碑好店 (MERCHANT_SEARCH) ====================
  else if (intent === "MERCHANT_SEARCH") {
    const whereCondition: any = {
      status: "APPROVED",
      ...(entities.keyword ? { name: { contains: entities.keyword, mode: "insensitive" } } : {}),
    };

    totalMatches = await prisma.shop.count({ where: whereCondition });
    const shops = await prisma.shop.findMany({
      where: whereCondition,
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    shops.forEach((s) => {
      resources.push({
        id: s.id,
        type: "SHOP",
        badgeText: "🏪 商家",
        title: s.name,
        price: "本地好店",
        subTitle: `${translateEnum(s.category)} · 口碑推荐`,
        highlightMeta: "支持到店消费",
        location: cleanLocationDisplay(s.address),
        url: `/haodian/${s.id}`,
        actionText: "查看好店 >",
      });
    });

    moreUrl = `/haodian`;
    moreText = totalMatches > 0 ? `查看全部 ${totalMatches} 家杨林本地好店 >` : "前往口碑好店名录 >";

    if (totalMatches === 0) {
      reply = `杨林本地好店名录暂未找到与“${message}”匹配的商户。建议您前往好店频道浏览更多餐饮与零售商家。`;
    }
  }

  // ==================== 场景 J: 社区热帖 (COMMUNITY_SEARCH) ====================
  else if (intent === "COMMUNITY_SEARCH") {
    const whereCondition: any = {
      status: "APPROVED",
      ...(entities.keyword ? { title: { contains: entities.keyword, mode: "insensitive" } } : {}),
    };

    totalMatches = await prisma.post.count({ where: whereCondition });
    const posts = await prisma.post.findMany({
      where: whereCondition,
      orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    posts.forEach((p) => {
      resources.push({
        id: p.id,
        type: "COMMUNITY",
        badgeText: "💬 社区",
        title: p.title,
        subTitle: `互动 ${p.repliesCount} · 围观 ${p.viewsCount}`,
        highlightMeta: formatRelativeTime(p.createdAt),
        url: `/community/${p.id}`,
        actionText: "查看讨论 >",
      });
    });

    moreUrl = `/community`;
    moreText = totalMatches > 0 ? `查看全部 ${totalMatches} 篇社区讨论帖 >` : "前往同城社区论坛 >";

    if (totalMatches === 0) {
      reply = `杨林同城社区中暂未找到与“${message}”相关的讨论话题。您可以在社区贴吧发起新话题与街坊们互动！`;
    }
  }

  // 3. 构建回答：
  // 严格原则：如果检索结果命中 (resources.length > 0)，调用 LLM 组织通顺、亲切的真实向导总结；
  // 如果 resources.length === 0，已经在上述各个分支中给出了诚恳、精准的业务说明，绝对不调用便民兜底！
  if (resources.length > 0) {
    const resourceSummary = resources
      .map(
        (r, i) =>
          `${i + 1}. [${r.badgeText}] ${r.title} | ${r.subTitle} | 核心参数: ${r.highlightMeta || "标准"} | 价格: ${r.price || "面议"}`
      )
      .join("\n");

    const fallbackResponse = (): string => {
      return `我帮您在杨林生活网检索到 ${totalMatches} 条相关本地信息，先为您挑选出匹配度最高的 ${resources.length} 条：`;
    };

    const systemPrompt =
      `你是「杨林生活助手」，实事求是的杨林本土智能搜索与向导。\n` +
      `【铁律】\n` +
      `1. 只能根据下方提供的【真实检索数据】向用户回答。绝对禁止编造虚假电话、不存在的企业或房源。\n` +
      `2. 采用【先总结、再引导查看】的结构：第一句直接说明找到了${totalMatches}条相关信息（如“我帮您在杨林生活网找到${totalMatches}条相关信息，先为您挑选出最匹配的几条：”），语气亲切干脆，不啰嗦。\n` +
      `3. 严禁使用虚假的夸大词。\n\n` +
      `【检索到的真实数据条目】：\n${resourceSummary}`;

    const aiResult = await invokeAi({
      scene: "CHAT",
      systemPrompt,
      userPrompt: `用户提问：“${message}”`,
      userId,
      fallbackFn: fallbackResponse,
    });

    reply = aiResult.content;
    isFallback = aiResult.isFallback;
  }

  // 4. 动态追问建议与智能会话标题
  const suggestedFollowUps = generateDynamicFollowUps(message, intentDecision);
  const conversationTitle = generateSmartConversationTitle(message, intentDecision);

  // 兜底保障：确保 reply 绝非空值，避免客户端渲染空白或不完整句子
  if (!reply || !reply.trim()) {
    if (resources.length > 0) {
      reply = `我帮您在杨林生活网检索到 ${totalMatches || resources.length} 条相关本地信息，先为您挑选出匹配度最高的内容：`;
    } else {
      reply = `杨林生活网本地智能助手已为您检索全域数据库。目前暂未找到与“${message}”完全匹配的信息，建议您尝试更换关键词查询，或前往相关专区浏览最新发布。`;
    }
  }

  return {
    reply,
    isFallback,
    totalMatches,
    moreUrl,
    moreText,
    resources,
    suggestedFollowUps,
    intent: intentDecision,
    conversationTitle,
  };
}
