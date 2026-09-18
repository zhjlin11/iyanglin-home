export type SearchIntent =
  | "JOB_SEARCH"
  | "HOUSE_SEARCH"
  | "INDUSTRIAL_SEARCH"
  | "SERVICE_SEARCH"
  | "INFO_SEARCH"
  | "MERCHANT_SEARCH"
  | "PRODUCT_SEARCH"
  | "COMMUNITY_SEARCH"
  | "GENERAL";

export interface SearchIntentResult {
  rawQuery: string;
  intent: SearchIntent;
  channel: string;
  channelLabel: string;
  category?: string;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  areaMin?: number;
  areaMax?: number;
  perks?: string[];
  keywords: string[];
  filterExplanation: string;
  tags: string[];
}

/**
 * 区域关键词词典
 */
const REGIONS = [
  "大学城",
  "经开区",
  "嵩明",
  "杨林",
  "职教园区",
  "领秀知识城",
  "长风街",
  "军马场",
  "嘉丽泽",
  "空港",
];

/**
 * 本地生活服务细分关键词映射
 */
const SERVICE_KEYWORDS: Record<string, string> = {
  修电脑: "电脑数码维修",
  电脑维修: "电脑数码维修",
  装系统: "电脑数码维修",
  开锁: "专业开锁换锁",
  修门锁: "专业开锁换锁",
  通下水道: "管道疏通清洗",
  疏通: "管道疏通清洗",
  家政: "保洁家政保姆",
  保洁: "保洁家政保姆",
  保姆: "保洁家政保姆",
  修水管: "水电安装维修",
  水电工: "水电安装维修",
  电工: "水电安装维修",
  搬家: "搬家拉货货运",
  货拉拉: "搬家拉货货运",
  修空调: "家电清洗维修",
  修冰箱: "家电清洗维修",
  修洗衣机: "家电清洗维修",
};

/**
 * 本地便民分类关键词映射
 */
const INFO_KEYWORDS: Record<string, string> = {
  电动车: "二手电动车",
  电瓶车: "二手电动车",
  拼车: "拼车顺风车",
  顺风车: "拼车顺风车",
  二手手机: "闲置数码",
  手机: "闲置数码",
  二手家具: "二手家具家电",
  二手家电: "二手家具家电",
  宠物: "宠物活体领养",
  狗狗: "宠物活体领养",
  猫咪: "宠物活体领养",
};

/**
 * 解析用户自然语言查询，输出精确意图、提取筛选槽位（Slots）与可解释标签
 */
export function parseSearchIntent(rawQuery: string): SearchIntentResult {
  const query = (rawQuery || "").trim();
  const lower = query.toLowerCase();

  const tags: string[] = [];
  const keywords: string[] = [];
  let region: string | undefined;

  // 1. 区域提取
  for (const r of REGIONS) {
    if (query.includes(r)) {
      region = r;
      tags.push(r);
      break;
    }
  }

  // 2. 意图分类与特征抽取

  // A. 工业地产 / 厂房 / 仓库
  if (
    query.includes("厂房") ||
    query.includes("车间") ||
    query.includes("仓库") ||
    query.includes("园区") ||
    query.includes("工业地")
  ) {
    let areaMin: number | undefined;
    let areaMax: number | undefined;

    const areaMatch = query.match(/(\d+)\s*(平|平方|平米|㎡)/);
    if (areaMatch) {
      const num = parseInt(areaMatch[1], 10);
      areaMin = Math.round(num * 0.8);
      areaMax = Math.round(num * 1.2);
      tags.push(`约${num}平米`);
    }

    tags.push("工业厂房");
    return {
      rawQuery: query,
      intent: "INDUSTRIAL_SEARCH",
      channel: "INDUSTRIAL",
      channelLabel: "工业地产",
      region,
      areaMin,
      areaMax,
      keywords: ["厂房", "仓库", ...(region ? [region] : [])],
      filterExplanation: `为你检索${region ? `【${region}】` : ""}符合条件的真实厂房与园区资源`,
      tags,
    };
  }

  // B. 求职招聘
  if (
    query.includes("工作") ||
    query.includes("招聘") ||
    query.includes("找活") ||
    query.includes("招工") ||
    query.includes("普工") ||
    query.includes("待遇") ||
    query.includes("月薪") ||
    query.includes("包吃") ||
    query.includes("文员") ||
    query.includes("司机")
  ) {
    let salaryMin: number | undefined;
    const salaryMatch = query.match(/(\d{4,5})\s*(以上|左右|起|\+)/);
    if (salaryMatch) {
      salaryMin = parseInt(salaryMatch[1], 10);
      tags.push(`月薪${salaryMin}+`);
    }

    const perks: string[] = [];
    if (query.includes("包吃住")) {
      perks.push("包吃住");
      tags.push("包吃住");
    } else {
      if (query.includes("包吃")) { perks.push("包吃"); tags.push("包吃"); }
      if (query.includes("包住")) { perks.push("包住"); tags.push("包住"); }
    }
    if (query.includes("五险")) { perks.push("五险"); tags.push("五险"); }

    const cleanKeywords = query
      .replace(/(找工作|招工|招聘|工作|找个活)/g, "")
      .replace(/(\d{4,5}\s*(以上|左右|起|\+)?)/g, "")
      .replace(/(包吃住|包吃|包住|五险)/g, "")
      .trim();

    if (cleanKeywords) {
      keywords.push(cleanKeywords);
      tags.push(cleanKeywords);
    }

    return {
      rawQuery: query,
      intent: "JOB_SEARCH",
      channel: "JOB",
      channelLabel: "求职招聘",
      region,
      salaryMin,
      perks,
      keywords: keywords.length ? keywords : ["招聘"],
      filterExplanation: `为你筛选${region ? `【${region}】` : ""}${salaryMin ? `薪资${salaryMin}元以上` : ""}${perks.length ? ` · ${perks.join(" · ")}` : ""}的招聘职位`,
      tags,
    };
  }

  // C. 房产楼市 / 租房
  if (
    query.includes("租房") ||
    query.includes("租") ||
    query.includes("房源") ||
    query.includes("公寓") ||
    query.includes("一室") ||
    query.includes("两室") ||
    query.includes("整租") ||
    query.includes("合租") ||
    query.includes("二手房") ||
    query.includes("买房")
  ) {
    let priceMax: number | undefined;
    const priceMatch = query.match(/(\d{3,4})\s*(以内|以下|内|块|元)/);
    if (priceMatch) {
      priceMax = parseInt(priceMatch[1], 10);
      tags.push(`${priceMax}元内`);
    }

    if (query.includes("一室") || query.includes("单间") || query.includes("标间")) {
      tags.push("一室/标间");
    } else if (query.includes("两室")) {
      tags.push("两室");
    } else if (query.includes("三室")) {
      tags.push("三室");
    }

    return {
      rawQuery: query,
      intent: "HOUSE_SEARCH",
      channel: "HOUSE",
      channelLabel: "房产租售",
      region,
      priceMax,
      keywords: ["房源", ...(region ? [region] : [])],
      filterExplanation: `为你搜索${region ? `【${region}】` : ""}${priceMax ? `预算在${priceMax}元内` : ""}的真实房源`,
      tags,
    };
  }

  // D. 上门服务与师傅维修
  for (const [kw, cat] of Object.entries(SERVICE_KEYWORDS)) {
    if (query.includes(kw)) {
      tags.push(cat);
      return {
        rawQuery: query,
        intent: "SERVICE_SEARCH",
        channel: "SERVICE_PRODUCT",
        channelLabel: "本地服务",
        category: cat,
        region,
        keywords: [kw, cat],
        filterExplanation: `为你匹配杨林本地认证【${cat}】师傅与上门服务`,
        tags,
      };
    }
  }

  // E. 便民信息与二手交易
  for (const [kw, cat] of Object.entries(INFO_KEYWORDS)) {
    if (query.includes(kw)) {
      tags.push(cat);
      return {
        rawQuery: query,
        intent: "INFO_SEARCH",
        channel: "LISTING",
        channelLabel: "便民分类",
        category: cat,
        region,
        keywords: [kw, cat],
        filterExplanation: `为你检索杨林便民分类【${cat}】最新发布内容`,
        tags,
      };
    }
  }

  // F. 口碑好店 / 餐饮美食 / 商家
  if (
    query.includes("店") ||
    query.includes("好吃的") ||
    query.includes("饭馆") ||
    query.includes("烧烤") ||
    query.includes("火锅") ||
    query.includes("奶茶") ||
    query.includes("餐厅") ||
    query.includes("超市")
  ) {
    tags.push("商家好店");
    return {
      rawQuery: query,
      intent: "MERCHANT_SEARCH",
      channel: "SHOP",
      channelLabel: "口碑好店",
      region,
      keywords: [query.replace(/(店|附近|哪有|有没有)/g, "").trim()],
      filterExplanation: `为你寻找杨林本地口碑商家与好店推荐`,
      tags,
    };
  }

  // G. 社区论坛 / 贴吧
  if (
    query.includes("贴吧") ||
    query.includes("论坛") ||
    query.includes("讨论") ||
    query.includes("爆料") ||
    query.includes("新鲜事") ||
    query.includes("避坑")
  ) {
    tags.push("社区热帖");
    return {
      rawQuery: query,
      intent: "COMMUNITY_SEARCH",
      channel: "POST",
      channelLabel: "社区贴吧",
      region,
      keywords: [query],
      filterExplanation: `为你匹配社区论坛热议话题与动态讨论`,
      tags,
    };
  }

  // 通用兜底
  tags.push(query);
  return {
    rawQuery: query,
    intent: "GENERAL",
    channel: "ALL",
    channelLabel: "综合搜索",
    region,
    keywords: [query],
    filterExplanation: `为你全站综合搜索包含“${query}”的内容`,
    tags,
  };
}
