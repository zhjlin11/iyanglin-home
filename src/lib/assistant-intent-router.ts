/**
 * AssistantIntentRouter
 * 专注于杨林生活网本地生活助手的确定性意图分类器与槽位提取器
 * 核心原则：
 * 1. 严格禁止未命中默认回退到便民 (No Default Info Fallback)
 * 2. 闲聊 (SMALL_TALK) 绝不查库、绝不附带推荐卡片、绝不伪造统计数
 * 3. 导航 (NAVIGATION) 直接输出频道指引与直达链接，避免无意义的内容搜索
 * 4. 业务意图 (JOB/HOUSE/INDUSTRIAL/SERVICE/INFO/MERCHANT/COMMUNITY) 严格域名隔离
 */

export type AssistantIntentType =
  | "SMALL_TALK"
  | "GENERAL_HELP"
  | "NAVIGATION"
  | "JOB_SEARCH"
  | "HOUSE_SEARCH"
  | "INDUSTRIAL_SEARCH"
  | "INFO_SEARCH"
  | "SERVICE_SEARCH"
  | "MERCHANT_SEARCH"
  | "COMMUNITY_SEARCH"
  | "PRODUCT_SEARCH"
  | "UNKNOWN";

export interface NavigationTarget {
  channelName: string;
  url: string;
  description: string;
  buttonText: string;
}

export interface AssistantEntities {
  region?: string;
  keyword?: string;
  // 求职招聘
  salaryMin?: number;
  salaryMax?: number;
  benefits?: string[];
  jobType?: "fulltime" | "parttime";
  jobSynonyms?: string[];
  // 房产租售
  houseType?: string;
  priceMin?: number;
  priceMax?: number;
  layout?: string;
  // 园区厂房
  factoryAreaMin?: number;
  factoryAreaMax?: number;
  hasCrane?: boolean;
  // 便民与服务
  category?: string;
  // 导航
  navTarget?: NavigationTarget;
}

export interface AssistantIntentDecision {
  rawQuery: string;
  intent: AssistantIntentType;
  confidence: number;
  entities: AssistantEntities;
  reasoning: string;
}

/**
 * 区域词典
 */
export const LOCAL_REGIONS = [
  "经开区",
  "杨林经开区",
  "大学城",
  "职教园区",
  "嵩明",
  "嵩明县城",
  "杨林",
  "杨林镇",
  "领秀知识城",
  "长风街",
  "军马场",
  "嘉丽泽",
  "空港",
  "俊发空港城",
];

/**
 * 职位同义词与扩展映射表（仅限招聘域内部使用，绝不污染便民）
 */
export const JOB_SYNONYMS: Record<string, string[]> = {
  普工: ["普工", "操作工", "生产工", "车间工人", "包装工", "组装工", "产线工"],
  操作工: ["操作工", "普工", "机台操作", "技术工", "生产工"],
  文员: ["文员", "后勤", "行政", "内勤", "前台", "助理", "档案员"],
  司机: ["司机", "驾驶员", "货车司机", "送货员", "货运司机"],
  电工: ["电工", "机电工", "强电工", "弱电工", "设备维修工"],
  机修: ["机修", "机修工", "设备维修", "机械维修", "维修工"],
  焊工: ["焊工", "二保焊", "电焊工", "氩弧焊"],
  仓管: ["仓管", "库管", "仓库管理员", "物料员", "发货员"],
  保安: ["保安", "门卫", "安保", "秩序维护员"],
  保洁: ["保洁", "保洁员", "清洁工"],
  服务员: ["服务员", "传菜员", "前厅接待", "收银员"],
  兼职: ["兼职", "日结", "小时工", "寒假工", "暑假工", "短期工"],
};

/**
 * 导航目标路由字典
 */
const NAVIGATION_CHANNELS: Array<{
  triggers: string[];
  target: NavigationTarget;
}> = [
  {
    triggers: [
      "招聘大厅", "经开区招聘大厅", "求职招聘大厅", "招聘频道", "招聘主页", "看招聘",
      "我要看招聘", "打开招聘", "进入招聘", "找工作入口", "查看招聘"
    ],
    target: {
      channelName: "求职招聘大厅",
      url: "/jobs",
      description: "杨林生活网招聘求职频道汇聚经开区大厂、知名企业及商户的最新真实直聘岗位。",
      buttonText: "进入求职招聘大厅",
    },
  },
  {
    triggers: [
      "房产大厅", "房产频道", "房产楼市", "租房大厅", "房产主页", "打开房产",
      "进入房产", "我要看房", "买房入口", "查看房产"
    ],
    target: {
      channelName: "房产楼市频道",
      url: "/house",
      description: "杨林生活网房产楼市汇聚大学城租房、整租合租、嵩明二手房与一手商用楼宇信息。",
      buttonText: "进入房产楼市频道",
    },
  },
  {
    triggers: [
      "厂房大厅", "厂房频道", "园区招商", "园区大厅", "工业地产", "进入厂房",
      "查看厂房频道", "厂房主页", "进入园区"
    ],
    target: {
      channelName: "园区厂房频道",
      url: "/industrial",
      description: "直连杨林经开区标准厂房、钢结构车间、行车起吊库房及工业用地招商直租。",
      buttonText: "进入园区厂房频道",
    },
  },
  {
    triggers: [
      "便民大厅", "便民分类大厅", "便民分类", "打开便民", "进入便民",
      "查看便民信息", "便民频道", "便民服务大厅"
    ],
    target: {
      channelName: "便民分类大厅",
      url: "/info",
      description: "杨林本地同城便民大厅，提供二手转让、顺风拼车、宠物领养、生活求助等信息发布与查询。",
      buttonText: "进入便民分类大厅",
    },
  },
  {
    triggers: [
      "找师傅大厅", "服务大厅", "本地服务", "家政大厅", "维修大厅", "找师傅频道",
      "进入服务"
    ],
    target: {
      channelName: "本地便民服务大厅",
      url: "/services",
      description: "认证同城水电维修、管道疏通、开锁修锁、家电清洗等专业师傅平台直约。",
      buttonText: "进入便民服务大厅",
    },
  },
  {
    triggers: ["好店名录", "好店频道", "商家名录", "杨林好店", "口碑好店", "进入好店"],
    target: {
      channelName: "口碑好店名录",
      url: "/haodian",
      description: "网罗大学城与杨林经开区高分餐厅、特色美食、便民商户与数码维修名录。",
      buttonText: "进入口碑好店名录",
    },
  },
  {
    triggers: ["社区贴吧", "论坛大厅", "同城社区", "杨林贴吧", "进入社区", "查看论坛"],
    target: {
      channelName: "同城社区论坛",
      url: "/community",
      description: "杨林本地居民、经开区员工与大学城师生交流互动、新鲜事打听与同城讨论社区。",
      buttonText: "进入同城社区论坛",
    },
  },
  {
    triggers: ["免费发布", "发布大厅", "我要发布", "发布入口", "发帖入口", "怎么发布"],
    target: {
      channelName: "免费信息发布大厅",
      url: "/publish",
      description: "支持企业快速招工、个人发布求职、房东挂牌租售、二手闲置转让及求助需求。",
      buttonText: "前往免费发布大厅",
    },
  },
];

/**
 * 闲聊匹配词正则
 */
const SMALL_TALK_REGEX = /^(你好|您好|hi|hello|hey|哈喽|在吗|在不在|有人吗|你是谁|你叫什么|介绍一下自己|你能做什么|你有什么功能|谢谢|感谢|多谢|thx|thanks|再见|拜拜|88|bye|好的|行|可以|知道了|明白|哈哈|呵呵|早上好|中午好|晚上好|晚安)[!！?？~～\s]*$/i;

/**
 * 主分类器与槽位提取器
 */
export function classifyAssistantIntent(rawQuery: string): AssistantIntentDecision {
  const query = (rawQuery || "").trim();
  const lower = query.toLowerCase();

  // 1. 优先识别闲聊 (SMALL_TALK)
  if (!query || SMALL_TALK_REGEX.test(query)) {
    return {
      rawQuery: query,
      intent: "SMALL_TALK",
      confidence: 0.98,
      entities: {},
      reasoning: "匹配到标准问候、身份咨询、礼貌答谢或确认应答词，无需检索数据库。",
    };
  }

  // 2. 识别导航直达意图 (NAVIGATION)
  for (const nav of NAVIGATION_CHANNELS) {
    const isMatched = nav.triggers.some((t) => {
      if (query === t) return true;
      if (query.includes(t) && (query.includes("怎么进") || query.includes("去哪里") || query.includes("入口") || query.includes("大厅") || query.includes("频道") || query.includes("打开") || query.includes("查看"))) {
        return true;
      }
      return false;
    });

    if (isMatched) {
      return {
        rawQuery: query,
        intent: "NAVIGATION",
        confidence: 0.95,
        entities: {
          navTarget: nav.target,
        },
        reasoning: `用户表达了前往【${nav.target.channelName}】的导航跳转意图，提供对应直达入口与说明。`,
      };
    }
  }

  // 3. 通用区域提取
  let region: string | undefined;
  for (const r of LOCAL_REGIONS) {
    if (query.includes(r)) {
      region = r === "杨林经开区" ? "经开区" : r;
      break;
    }
  }

  // 4. 求职招聘意图 (JOB_SEARCH)
  // 必须识别："帮我找普工工作"、"帮我找普工"、"帮我推荐工作"、"经开区月薪5000+包吃住招聘"、"包吃住的工作" 等
  const hasJobKeyword =
    query.includes("工作") ||
    query.includes("招聘") ||
    query.includes("岗位") ||
    query.includes("找工作") ||
    query.includes("找活") ||
    query.includes("招工") ||
    query.includes("求职") ||
    query.includes("用工") ||
    query.includes("普工") ||
    query.includes("操作工") ||
    query.includes("车间工人") ||
    query.includes("包装工") ||
    query.includes("文员") ||
    query.includes("司机") ||
    query.includes("电工") ||
    query.includes("机修") ||
    query.includes("仓管") ||
    query.includes("焊工") ||
    query.includes("两班倒") ||
    query.includes("长白班") ||
    query.includes("兼职") ||
    query.includes("日结") ||
    query.includes("月薪") ||
    query.includes("包吃住") ||
    (query.includes("企业") && query.includes("招"));

  // 严防“修电脑的工作人员”或“打扫房间的家政保洁”误伤：如果有明显服务词且无工作/岗位词，优先服务
  const isDirectService =
    (query.includes("修") || query.includes("疏通") || query.includes("开锁") || query.includes("家政")) &&
    !query.includes("工作") &&
    !query.includes("招聘") &&
    !query.includes("求职") &&
    !query.includes("岗位");

  if (hasJobKeyword && !isDirectService) {
    let salaryMin: number | undefined;
    const salaryMatch = query.match(/(\d{4,5})\s*(以上|左右|起|\+)/) || query.match(/月薪\s*(\d{4,5})/);
    if (salaryMatch) {
      salaryMin = parseInt(salaryMatch[1], 10);
    }

    const benefits: string[] = [];
    if (query.includes("包吃住")) {
      benefits.push("包吃住");
    } else {
      if (query.includes("包吃")) benefits.push("包吃");
      if (query.includes("包住")) benefits.push("包住");
    }
    if (query.includes("五险")) benefits.push("五险");
    if (query.includes("长白班")) benefits.push("长白班");
    if (query.includes("双休")) benefits.push("双休");

    const jobType: "fulltime" | "parttime" =
      query.includes("兼职") || query.includes("日结") || query.includes("小时工") ? "parttime" : "fulltime";

    // 寻找具体工种
    let targetJobKey: string | undefined;
    let jobSynonyms: string[] = [];
    for (const [canonical, syns] of Object.entries(JOB_SYNONYMS)) {
      if (syns.some((s) => query.includes(s))) {
        targetJobKey = canonical;
        jobSynonyms = syns;
        break;
      }
    }

    // 提取纯粹关键词（移除通用词）
    let cleanKw = query
      .replace(/(帮我找|帮我推荐|我想找|找个|找一份|找|推荐|招聘|工作|岗位|职位|招工|求职|信息)/g, " ")
      .replace(/(经开区|杨林|大学城|嵩明|职教园区)/g, " ")
      .replace(/(\d{4,5}\s*(以上|左右|起|\+)?)/g, " ")
      .replace(/(包吃住|包吃|包住|五险一金|五险|长白班|两班倒)/g, " ")
      .trim();

    if (cleanKw === "月薪" || cleanKw === "的" || cleanKw.length < 2) {
      cleanKw = "";
    }

    return {
      rawQuery: query,
      intent: "JOB_SEARCH",
      confidence: 0.95,
      entities: {
        region,
        salaryMin,
        benefits,
        jobType,
        keyword: targetJobKey || cleanKw || undefined,
        jobSynonyms: jobSynonyms.length ? jobSynonyms : undefined,
      },
      reasoning: `识别为招聘求职意图。工种:${targetJobKey || "不限"}, 区域:${region || "杨林全域"}, 最低薪资:${salaryMin || "不限"}, 福利:${benefits.join("/") || "不限"}。`,
    };
  }

  // 5. 园区厂房与仓储地产意图 (INDUSTRIAL_SEARCH)
  // 必须识别：“标准厂房带行车出租”、“2000平厂房”、“园区仓库”
  if (
    query.includes("厂房") ||
    query.includes("车间") ||
    query.includes("仓库") ||
    query.includes("库房") ||
    query.includes("工业地") ||
    query.includes("地皮") ||
    query.includes("园区招商") ||
    (query.includes("行车") && (query.includes("吨") || query.includes("起吊") || query.includes("厂"))) ||
    query.includes("工业地产")
  ) {
    let factoryAreaMin: number | undefined;
    let factoryAreaMax: number | undefined;

    const areaMatch = query.match(/(\d+)\s*(平|平方|平米|㎡)/);
    if (areaMatch) {
      const num = parseInt(areaMatch[1], 10);
      factoryAreaMin = Math.round(num * 0.7);
      factoryAreaMax = Math.round(num * 1.3);
    }

    const hasCrane =
      query.includes("行车") || query.includes("行吊") || query.includes("天车") || query.includes("起吊");

    return {
      rawQuery: query,
      intent: "INDUSTRIAL_SEARCH",
      confidence: 0.95,
      entities: {
        region,
        factoryAreaMin,
        factoryAreaMax,
        hasCrane,
        keyword: query.includes("仓库") ? "仓库" : query.includes("厂房") ? "厂房" : undefined,
      },
      reasoning: `识别为工业厂房/园区地产意图。面积范围:${factoryAreaMin || "不限"}-${factoryAreaMax || "不限"}, 是否带行车:${hasCrane ? "必须带行车" : "不限"}。`,
    };
  }

  // 6. 房产楼市与租房 (HOUSE_SEARCH)
  // 必须识别：“大学城租房”、“1500以内一室房”、“嵩明二手房”
  if (
    query.includes("租房") ||
    query.includes("房子") ||
    query.includes("房源") ||
    query.includes("公寓") ||
    query.includes("单间") ||
    query.includes("一室") ||
    query.includes("两室") ||
    query.includes("三室") ||
    query.includes("合租") ||
    query.includes("整租") ||
    query.includes("出租房") ||
    query.includes("二手房") ||
    query.includes("买房")
  ) {
    let priceMax: number | undefined;
    const priceMatch = query.match(/(\d{3,4})\s*(以内|以下|内|块|元)/);
    if (priceMatch) {
      priceMax = parseInt(priceMatch[1], 10);
    }

    let layout: string | undefined;
    if (query.includes("一室") || query.includes("单间") || query.includes("标间")) {
      layout = "一室";
    } else if (query.includes("两室")) {
      layout = "两室";
    } else if (query.includes("三室")) {
      layout = "三室";
    }

    const houseType =
      query.includes("二手房") || query.includes("买房") ? "secondhand" : query.includes("商铺") ? "shop" : "rent";

    return {
      rawQuery: query,
      intent: "HOUSE_SEARCH",
      confidence: 0.93,
      entities: {
        region,
        priceMax,
        layout,
        houseType,
      },
      reasoning: `识别为房产租售意图。类型:${houseType}, 户型:${layout || "不限"}, 价格上限:${priceMax || "不限"}。`,
    };
  }

  // 7. 本地便民服务与上门师傅 (SERVICE_SEARCH)
  // 必须识别：“修电脑”、“找水电维修”、“修门锁”、“管道疏通”、“家政保洁”
  const SERVICE_MAP: Record<string, string> = {
    修电脑: "电脑数码维修",
    电脑维修: "电脑数码维修",
    装系统: "电脑数码维修",
    修手机: "数码手机维修",
    手机维修: "数码手机维修",
    开锁: "专业开锁换锁",
    换锁: "专业开锁换锁",
    修门锁: "专业开锁换锁",
    疏通: "管道疏通清洗",
    通下水道: "管道疏通清洗",
    下水管: "管道疏通清洗",
    马桶堵了: "管道疏通清洗",
    家政: "保洁家政保姆",
    保洁: "保洁家政保姆",
    保姆: "保洁家政保姆",
    保洁阿姨: "保洁家政保姆",
    打扫卫生: "保洁家政保姆",
    修水管: "水电安装维修",
    水电维修: "水电安装维修",
    水电工: "水电安装维修",
    水龙头: "水电安装维修",
    角阀: "水电安装维修",
    跳闸: "水电安装维修",
    电路维修: "水电安装维修",
    漏电: "水电安装维修",
    搬家: "搬家拉货货运",
    拉货: "搬家拉货货运",
    货拉拉: "搬家拉货货运",
    修空调: "家电清洗维修",
    洗空调: "家电清洗维修",
    修冰箱: "家电清洗维修",
    修洗衣机: "家电清洗维修",
    家电维修: "家电清洗维修",
    防水补漏: "房屋防水补漏",
    打胶: "房屋防水补漏",
    安装监控: "弱电监控安防",
    打孔: "工程打孔切割",
  };

  for (const [key, category] of Object.entries(SERVICE_MAP)) {
    if (query.includes(key)) {
      return {
        rawQuery: query,
        intent: "SERVICE_SEARCH",
        confidence: 0.94,
        entities: {
          region,
          category,
          keyword: key,
        },
        reasoning: `识别为上门便民师傅与专业服务意图。分类:【${category}】，核心关键词:【${key}】。`,
      };
    }
  }

  // 8. 纯便民与二手交易 (INFO_SEARCH)
  // 必须识别：“顺风车”、“拼车”、“二手电动车”、“宠物领养”、“闲置转让”
  const INFO_MAP: Record<string, string> = {
    拼车: "同城拼车/顺风车",
    顺风车: "同城拼车/顺风车",
    电动车: "二手电动车",
    电瓶车: "二手电动车",
    二手车: "二手汽车",
    闲置: "二手闲置",
    二手家具: "二手家具",
    二手家电: "二手家电",
    二手手机: "二手闲置",
    宠物: "宠物领养",
    狗狗: "宠物领养",
    猫咪: "宠物领养",
    失物招领: "失物招领",
    寻物: "寻人寻物",
    寻狗: "寻人寻物",
  };

  for (const [key, category] of Object.entries(INFO_MAP)) {
    if (query.includes(key)) {
      return {
        rawQuery: query,
        intent: "INFO_SEARCH",
        confidence: 0.92,
        entities: {
          region,
          category,
          keyword: key,
        },
        reasoning: `识别为同城便民与二手转让意图。分类:【${category}】。`,
      };
    }
  }

  // 9. 好店商家名录 (MERCHANT_SEARCH)
  // 识别：“好吃的”、“火锅”、“烧烤”、“奶茶”、“餐厅”、“超市”
  if (
    query.includes("好吃的") ||
    query.includes("火锅") ||
    query.includes("烧烤") ||
    query.includes("奶茶") ||
    query.includes("餐馆") ||
    query.includes("饭店") ||
    query.includes("特色菜") ||
    query.includes("超市") ||
    (query.includes("店") && !query.includes("酒店") && !query.includes("车间"))
  ) {
    return {
      rawQuery: query,
      intent: "MERCHANT_SEARCH",
      confidence: 0.88,
      entities: {
        region,
        keyword: query.replace(/(好店|推荐|附近|有没有|哪有)/g, "").trim(),
      },
      reasoning: "识别为杨林本地餐饮美食或商户名录意图。",
    };
  }

  // 10. 社区论坛讨论 (COMMUNITY_SEARCH)
  if (
    query.includes("贴吧") ||
    query.includes("论坛") ||
    query.includes("吐槽") ||
    query.includes("爆料") ||
    query.includes("打听") ||
    query.includes("新鲜事")
  ) {
    return {
      rawQuery: query,
      intent: "COMMUNITY_SEARCH",
      confidence: 0.85,
      entities: {
        region,
        keyword: query,
      },
      reasoning: "识别为社区同城贴吧互动意图。",
    };
  }

  // 11. 低置信度或未知意图 (UNKNOWN)
  // 宁可礼貌追问用户是找工作、租房还是找师傅，绝不默认兜底到便民！
  return {
    rawQuery: query,
    intent: "UNKNOWN",
    confidence: 0.3,
    entities: {
      keyword: query,
    },
    reasoning: "无法以高置信度归类到具体业务板块，需引导用户明确意图，严禁默认回退到便民数据。",
  };
}
