/**
 * 便民信息 / 综合信息 (分类信息与同城生活服务) 分类与属性体系
 * 完美结合老站 (www.yanglinol.com) 经典业务模型与 2026 现代多端交互规范
 */

export interface InfoDynamicField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface InfoCategory {
  key: string;            // 英文标识 (支持枚举名与旧版小写slug)
  enumKey: string;        // 标准P0枚举标识 (如 SECOND_HAND, CARPOOL)
  name: string;           // 分类全称 (如 "二手闲置", "同城拼车")
  shortName: string;      // 手机端4字标准简称 (如 "二手闲置", "同城拼车", "家政维修")
  icon: string;           // Emoji / 图标
  lucideIconName: string; // Lucide 图标名称
  badgeColor: string;
  bgLight: string;
  textColor: string;
  desc: string;
  description?: string;
  subCategories: string[];
  fieldConfig: {
    showCarpoolFields?: boolean; // 出发地、目的地、发车时间、剩余座位、车型
    showCondition?: boolean;     // 物品成色
    showPrice?: boolean;         // 价格/面议
    pricePlaceholder?: string;   // 价格占位符
    priceUnit?: string;          // 价格默认单位 (元, 元/座, 元/小时, 元/斤)
    itemTypes: Array<{ label: string; value: string; shortLabel: string }>;
    dynamicFields?: InfoDynamicField[];
  };
}

export const INFO_CATEGORIES: InfoCategory[] = [
  {
    key: "used",
    enumKey: "SECOND_HAND",
    name: "二手闲置",
    shortName: "二手闲置",
    icon: "📦",
    lucideIconName: "Package",
    badgeColor: "bg-amber-500 text-white",
    bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    textColor: "text-amber-600",
    desc: "手机数码、代步电车、家具家电、教材资料、潮玩转让",
    subCategories: [
      "全部二手",
      "手机数码",
      "电动车/单车",
      "宿舍/办公家具",
      "家用电器",
      "课本教材/考研资料",
      "服饰箱包/潮玩",
      "健身运动器材",
      "其他闲置物品",
    ],
    fieldConfig: {
      showCondition: true,
      showPrice: true,
      pricePlaceholder: "转让金额(元)，留空或0为面议",
      priceUnit: "元",
      itemTypes: [
        { label: "闲置转让 (出售)", value: "FOR_SALE", shortLabel: "出售" },
        { label: "闲置求购 (寻找)", value: "WANTED_BUY", shortLabel: "求购" },
      ],
      dynamicFields: [
        { key: "isNegotiable", label: "是否可议价", type: "select", options: ["支持小刀议价", "一口价不议", "买多可优惠"] },
        { key: "pickupArea", label: "自提地点", type: "text", placeholder: "如：大学城南门、经开区管委会旁自提" },
      ],
    },
  },
  {
    key: "carpool",
    enumKey: "CARPOOL",
    name: "同城拼车/顺风车",
    shortName: "同城拼车",
    icon: "🚗",
    lucideIconName: "Car",
    badgeColor: "bg-emerald-600 text-white",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textColor: "text-emerald-600",
    desc: "杨林大学城-昆明市区-嵩明老城-长水机场顺风拼车",
    subCategories: [
      "全部拼车",
      "车找人",
      "人找车",
      "往返昆明市区",
      "往返长水机场",
      "天天通勤班车",
      "货运拉货拼车",
    ],
    fieldConfig: {
      showCarpoolFields: true,
      showPrice: true,
      pricePlaceholder: "AA车费/座(元)，如：25",
      priceUnit: "元/座",
      itemTypes: [
        { label: "车找人 (车主发车)", value: "OFFER", shortLabel: "车找人" },
        { label: "人找车 (求搭车)", value: "WANTED", shortLabel: "人找车" },
      ],
      dynamicFields: [
        { key: "carModel", label: "车辆型号", type: "text", placeholder: "如：白色大众朗逸、SUV" },
        { key: "seats", label: "剩余空位", type: "select", options: ["余1座", "余2座", "余3座", "余4座", "大件拉货包车"] },
      ],
    },
  },
  {
    key: "service",
    enumKey: "HOME_SERVICE",
    name: "生活家政与维修",
    shortName: "家政维修",
    icon: "🛠️",
    lucideIconName: "Wrench",
    badgeColor: "bg-blue-600 text-white",
    bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    textColor: "text-blue-600",
    desc: "上门开锁、家电空调维修、管道疏通、保洁搬家、水电打孔",
    subCategories: [
      "全部家政",
      "上门开锁换锁",
      "家电空调维修",
      "管道疏通/下水",
      "搬家拉货/货运",
      "家庭/开荒保洁",
      "房屋修缮/水电打孔",
      "沙发窗帘清洗",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "起步服务费(元)，面议填0",
      priceUnit: "元起",
      itemTypes: [
        { label: "提供专业服务", value: "OFFER", shortLabel: "提供服务" },
        { label: "寻找师傅帮忙", value: "WANTED", shortLabel: "寻找服务" },
      ],
      dynamicFields: [
        { key: "isOnSite", label: "服务方式", type: "select", options: ["提供上门服务", "到店/指定地点", "线上指导"] },
        { key: "serviceTime", label: "响应时间", type: "text", placeholder: "如：20分钟内急速上门、白天随时可约" },
      ],
    },
  },
  {
    key: "digital",
    enumKey: "DIGITAL",
    name: "电脑网络与数码",
    shortName: "电脑数码",
    icon: "💻",
    lucideIconName: "Laptop",
    badgeColor: "bg-indigo-600 text-white",
    bgLight: "bg-indigo-50 text-indigo-700 border-indigo-200",
    textColor: "text-indigo-600",
    desc: "电脑装机重装系统、宽带监控布线、打印机耗材、芯片维修",
    subCategories: [
      "全部数码",
      "电脑装机/重装系统",
      "笔记本芯片级维修",
      "网络布线/安防监控",
      "打印机复印机耗材",
      "手机刷机更换屏幕",
      "数据恢复/软件支持",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "配件或维修报价(元)",
      priceUnit: "元",
      itemTypes: [
        { label: "提供专业数码服务", value: "OFFER", shortLabel: "数码服务" },
        { label: "故障求助/求购", value: "WANTED", shortLabel: "故障求助" },
      ],
      dynamicFields: [
        { key: "deviceType", label: "涉及设备", type: "text", placeholder: "如：台式机、联想拯救者、监控主机" },
        { key: "serviceWay", label: "服务方式", type: "select", options: ["支持上门维修", "送修到店", "远程协助"] },
      ],
    },
  },
  {
    key: "farm",
    enumKey: "AGRICULTURE",
    name: "本地农产与生鲜",
    shortName: "农产生活",
    icon: "🍉",
    lucideIconName: "Apple",
    badgeColor: "bg-green-600 text-white",
    bgLight: "bg-green-50 text-green-700 border-green-200",
    textColor: "text-green-600",
    desc: "嵩明高原鲜花果蔬、农家散养土鸡土蛋、苗木采摘批发",
    subCategories: [
      "全部农产",
      "当季果蔬采摘",
      "散养土鸡土鸡蛋",
      "嵩明鲜花苗木",
      "特色粮油米面",
      "农机农具/肥料",
      "绿色特产批发",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "单斤/整件批发价(元)",
      priceUnit: "元/斤",
      itemTypes: [
        { label: "农家农产供应", value: "OFFER", shortLabel: "农产供应" },
        { label: "批量求购/寻货源", value: "WANTED", shortLabel: "批量求购" },
      ],
      dynamicFields: [
        { key: "freshOrigin", label: "产地/基地", type: "text", placeholder: "如：嵩明杨林自种基地、现摘现发" },
        { key: "isWholesale", label: "供应方式", type: "select", options: ["支持零售零售", "量大批发出厂价", "可包园采摘"] },
      ],
    },
  },
  {
    key: "food",
    enumKey: "FOOD",
    name: "特色美食与餐饮",
    shortName: "美食餐饮",
    icon: "🍜",
    lucideIconName: "Utensils",
    badgeColor: "bg-rose-600 text-white",
    bgLight: "bg-rose-50 text-rose-700 border-rose-200",
    textColor: "text-rose-600",
    desc: "杨林肥酒酸菜牛肉、大学城夜市美食外卖、餐饮档口转让",
    subCategories: [
      "全部餐饮",
      "本地招牌特色",
      "大学城夜市美食",
      "外卖快餐便当",
      "团餐预订/宴席",
      "档口摊位转让",
      "美食折扣优惠券",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "人均/单份价格(元)",
      priceUnit: "元/人",
      itemTypes: [
        { label: "美食外卖/招牌推荐", value: "OFFER", shortLabel: "美食供应" },
        { label: "档口求转让/寻合作", value: "WANTED", shortLabel: "求转让合作" },
      ],
      dynamicFields: [
        { key: "diningWay", label: "就餐方式", type: "select", options: ["支持堂食与自提", "大学城专人配送", "团购优惠"] },
        { key: "dishSpecial", label: "招牌特色", type: "text", placeholder: "如：正宗杨林酸菜牛肉、特色烧烤" },
      ],
    },
  },
  {
    key: "business",
    enumKey: "BUSINESS_SERVICE",
    name: "商务服务与财税",
    shortName: "商务财税",
    icon: "🏢",
    lucideIconName: "Building2",
    badgeColor: "bg-cyan-700 text-white",
    bgLight: "bg-cyan-50 text-cyan-800 border-cyan-200",
    textColor: "text-cyan-700",
    desc: "经开区工商注册代办、代理记账财税、广告标牌、法律咨询",
    subCategories: [
      "全部商务",
      "工商注册/代办注销",
      "代理记账/财税咨询",
      "广告制作/标牌喷绘",
      "法律咨询/合同审查",
      "办公设备租赁",
      "环评消防资质代办",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "咨询/代办起步价(元)",
      priceUnit: "元起",
      itemTypes: [
        { label: "企业商务服务", value: "OFFER", shortLabel: "企业服务" },
        { label: "业务求助/外包需求", value: "WANTED", shortLabel: "业务需求" },
      ],
      dynamicFields: [
        { key: "serviceScope", label: "服务范围", type: "select", options: ["经开区及嵩明全境", "面向园区企业", "全省通办"] },
      ],
    },
  },
  {
    key: "pet",
    enumKey: "PET",
    name: "宠物生活与领养",
    shortName: "宠物生活",
    icon: "🐾",
    lucideIconName: "Dog",
    badgeColor: "bg-orange-600 text-white",
    bgLight: "bg-orange-50 text-orange-700 border-orange-200",
    textColor: "text-orange-600",
    desc: "宠物猫狗有偿转让、同城爱心免费领养、寄养洗护、寻宠启事",
    subCategories: [
      "全部宠物",
      "爱心免费领养",
      "猫咪生活/繁育",
      "狗狗天地",
      "宠物寄养/洗护",
      "宠物用品/猫粮狗粮",
      "寻宠启事",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "领养/转让费用(元，免费填0)",
      priceUnit: "元",
      itemTypes: [
        { label: "送养/转让宠物", value: "OFFER", shortLabel: "转让/送养" },
        { label: "求领养/寻找爱宠", value: "WANTED", shortLabel: "求领养" },
      ],
      dynamicFields: [
        { key: "petAge", label: "宠物年龄", type: "text", placeholder: "如：3个月、1岁成犬" },
        { key: "vaccinated", label: "疫苗绝育", type: "select", options: ["疫苗齐全已驱虫", "已完成首针疫苗", "已绝育", "未绝育"] },
      ],
    },
  },
  {
    key: "education",
    enumKey: "TUTORING",
    name: "技能培训与家教",
    shortName: "培训家教",
    icon: "🎓",
    lucideIconName: "GraduationCap",
    badgeColor: "bg-violet-600 text-white",
    bgLight: "bg-violet-50 text-violet-700 border-violet-200",
    textColor: "text-violet-600",
    desc: "大学城驾校练车、中小学一对一家教辅导、专升本考研考公",
    subCategories: [
      "全部培训",
      "驾校报名/练车",
      "中小学一对一家教",
      "专升本/考研考公",
      "职业资格技能考证",
      "少儿艺术特长/乐器",
      "考研自习室/图书",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "学费或课时费(元)",
      priceUnit: "元/课时",
      itemTypes: [
        { label: "招生报名/辅导", value: "OFFER", shortLabel: "招生辅导" },
        { label: "寻找老师/家教需求", value: "WANTED", shortLabel: "求学家教" },
      ],
      dynamicFields: [
        { key: "subject", label: "涉及科目", type: "text", placeholder: "如：初高中数理化、C1驾照、专升本英语" },
        { key: "teachingWay", label: "授课形式", type: "select", options: ["一对一上门辅导", "机构小班面授", "驾校包接送练车"] },
      ],
    },
  },
  {
    key: "help",
    enumKey: "HELP",
    name: "便民求助与失物",
    shortName: "便民求助",
    icon: "🔍",
    lucideIconName: "Search",
    badgeColor: "bg-teal-600 text-white",
    bgLight: "bg-teal-50 text-teal-700 border-teal-200",
    textColor: "text-teal-600",
    desc: "失物招领、寻物寻人、同城打听问路、拼单代取快递、互助",
    subCategories: [
      "全部求助",
      "失物招领",
      "寻物启事/寻人",
      "同城打听/问路",
      "拼单互助/代取快递",
      "公益互助/志愿者",
    ],
    fieldConfig: {
      showPrice: true,
      pricePlaceholder: "感谢酬金(元，无酬劳可填0)",
      priceUnit: "元酬谢",
      itemTypes: [
        { label: "拾得物品/提供线索", value: "OFFER", shortLabel: "提供线索" },
        { label: "求助寻物/打听求援", value: "HELP", shortLabel: "发布求助" },
      ],
      dynamicFields: [
        { key: "urgency", label: "紧急程度", type: "select", options: ["普通互助", "加急急寻", "十万火急"] },
        { key: "eventPlace", label: "发生地点", type: "text", placeholder: "如：大学城商业街、工商学院二食堂门口" },
      ],
    },
  },
];

/**
 * 常见热门搜索词 (后台未配置时的优质兜底)
 */
export const DEFAULT_INFO_HOT_SEARCHES = [
  { q: "昆明拼车", label: "🚗 昆明拼车" },
  { q: "电动车", label: "🛵 电动车" },
  { q: "家电维修", label: "🛠️ 维修疏通" },
  { q: "机场顺风车", label: "✈️ 机场顺风车" },
  { q: "本地农特产", label: "🍉 本地农特产" },
  { q: "失物招领", label: "🔍 失物招领" },
];

/**
 * 时间范围筛选选项
 */
export const TIME_RANGES = [
  { key: "all", value: "all", label: "全部时间" },
  { key: "today", value: "today", label: "今天内" },
  { key: "3days", value: "3days", label: "3天内" },
  { key: "7days", value: "7days", label: "7天内" },
  { key: "30days", value: "30days", label: "30天内" },
] as const;

/**
 * 物品成色定义
 */
export const ITEM_CONDITIONS = [
  "不限成色",
  "全新未拆",
  "99新 (仅拆封)",
  "95新 (轻微使用)",
  "9成新 (功能完好)",
  "8成新 (实用划算)",
] as const;

/**
 * 供求性质标准字典与友好展示标签
 */
export function getItemTypeDisplay(
  itemType?: string | null,
  categoryKey?: string
): { label: string; shortLabel: string; bg: string; color: string } {
  const norm = (itemType || "OFFER").trim().toUpperCase();

  // 如果分类有专属定制 shortLabel，优先取该分类配置
  if (categoryKey) {
    const cat = getCategoryByKey(categoryKey);
    const matched = cat?.fieldConfig.itemTypes.find((it) => it.value === norm);
    if (matched) {
      const isSupply = norm === "OFFER" || norm === "FOR_SALE" || norm === "FOR_RENT";
      return {
        label: matched.label,
        shortLabel: matched.shortLabel,
        bg: isSupply ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-purple-50 text-purple-700 border-purple-200",
        color: isSupply ? "#047857" : "#7e22ce",
      };
    }
  }

  switch (norm) {
    case "FOR_SALE":
    case "TRANSFER":
      return { label: "转让/出售", shortLabel: "出售", bg: "bg-amber-50 text-amber-700 border-amber-200", color: "#b45309" };
    case "FOR_RENT":
      return { label: "出租", shortLabel: "出租", bg: "bg-blue-50 text-blue-700 border-blue-200", color: "#1d4ed8" };
    case "WANTED_BUY":
    case "WANTED_RENT":
    case "WANTED":
      return { label: "需求/求购", shortLabel: "求购", bg: "bg-purple-50 text-purple-700 border-purple-200", color: "#7e22ce" };
    case "HELP":
      return { label: "同城求助", shortLabel: "求助", bg: "bg-rose-50 text-rose-700 border-rose-200", color: "#be123c" };
    case "OFFER":
    default:
      return { label: "提供/供应", shortLabel: "提供", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "#047857" };
  }
}

/**
 * 彻底净化开发代码字段，杜绝前台展示 shop, offer, wanted 等英文内部词
 */
export function toCleanChineseText(raw?: string | null): string {
  if (!raw) return "";
  const r = raw.trim().toLowerCase();
  if (r === "shop") return "本地商家";
  if (r === "listing") return "便民信息";
  if (r === "offer") return "提供";
  if (r === "wanted") return "求购/需求";
  if (r === "transfer") return "转让";
  if (r === "for_sale") return "出售";
  if (r === "for_rent") return "出租";
  if (r === "help") return "同城求助";
  if (r === "job") return "求职招聘";
  if (r === "house") return "房屋租售";
  if (r === "undefined" || r === "null") return "";
  return raw;
}

/**
 * 根据键名获取分类 (兼容英文key, 枚举key, 中文名称)
 */
export function getCategoryByKey(key: string): InfoCategory | undefined {
  if (!key) return undefined;
  const k = key.trim().toLowerCase();
  const upper = key.trim().toUpperCase();
  return INFO_CATEGORIES.find(
    (c) =>
      c.key.toLowerCase() === k ||
      c.enumKey === upper ||
      c.name === key ||
      c.shortName === key
  );
}

export function getCategoryByName(name: string): InfoCategory | undefined {
  return getCategoryByKey(name);
}

/**
 * 获取分类色彩标签
 */
export function getCategoryBadge(categoryName: string) {
  const cat = getCategoryByName(categoryName);
  if (cat) {
    return {
      name: cat.shortName,
      fullName: cat.name,
      icon: cat.icon,
      badgeColor: cat.badgeColor,
      bgLight: cat.bgLight,
      textColor: cat.textColor,
    };
  }
  return {
    name: categoryName || "便民生活",
    fullName: categoryName || "便民信息",
    icon: "📋",
    badgeColor: "bg-teal-600 text-white",
    bgLight: "bg-teal-50 text-teal-700 border-teal-200",
    textColor: "text-teal-600",
  };
}

/**
 * 区域常量列表
 */
export const INFO_AREAS = [
  "全部区域",
  "杨林大学城",
  "杨林经开区",
  "杨林老镇",
  "嵩明主城区",
  "长水机场周边",
  "其他区域",
];

/**
 * 获取供求类型徽标
 */
export function getItemTypeBadge(category: string, itemType?: string | null) {
  const display = getItemTypeDisplay(itemType, category);
  return {
    label: display.shortLabel || display.label,
    className: display.bg,
    color: display.color,
  };
}

