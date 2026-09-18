export interface RawEventInput {
  index: number;
  title: string;
  category?: string;
  eventTime?: string;
  location?: string;
  fee?: string;
  quota?: string;
  contact?: string;
  intro?: string;
  images?: string[];
}

export interface NormalizedEventRecord {
  oldId: string;
  title: string;
  category: string; // camping | hiking | esports | lecture | campus | jobfair | promotion | parenting | party | sport
  eventTime: string;
  location: string;
  fee: string;
  quota: string;
  contact: string;
  intro: string;
  images: string[];
  status: "APPROVED" | "PENDING";
}

export function normalizeEventRecord(raw: RawEventInput): NormalizedEventRecord {
  const indexStr = String(raw.index).padStart(3, "0");
  const oldId = `LEGACY_EVENT_0723_${indexStr}`;

  // 1. Standardize category
  let category = "party";
  const rawCat = (raw.category || raw.title || "").toLowerCase();
  if (rawCat.includes("露营") || rawCat.includes("野营")) {
    category = "camping";
  } else if (rawCat.includes("徒步") || rawCat.includes("爬山") || rawCat.includes("户外")) {
    category = "hiking";
  } else if (rawCat.includes("电竞") || rawCat.includes("游戏") || rawCat.includes("比赛")) {
    category = "esports";
  } else if (rawCat.includes("讲座") || rawCat.includes("培训") || rawCat.includes("分享会")) {
    category = "lecture";
  } else if (rawCat.includes("校园") || rawCat.includes("大学") || rawCat.includes("社团")) {
    category = "campus";
  } else if (rawCat.includes("招聘") || rawCat.includes("双选会") || rawCat.includes("就业")) {
    category = "jobfair";
  } else if (rawCat.includes("促销") || rawCat.includes("团购") || rawCat.includes("打折")) {
    category = "promotion";
  } else if (rawCat.includes("亲子") || rawCat.includes("儿童") || rawCat.includes("育儿")) {
    category = "parenting";
  } else if (rawCat.includes("球") || rawCat.includes("跑") || rawCat.includes("健身")) {
    category = "sport";
  }

  // 2. Standardize event location
  let location = raw.location?.trim() || "杨林大学城中央公园大草坪";
  if (!location.includes("杨林") && !location.includes("嵩明")) {
    location = `杨林大学城 · ${location}`;
  }

  // 3. Standardize contact phone
  const rawContact = raw.contact?.trim() || "";
  let cleanPhone = rawContact;
  const phoneMatch = rawContact.match(/1[3-9]\d{9}/);
  if (phoneMatch) {
    cleanPhone = phoneMatch[0];
  }

  // 4. Standardize event time
  const eventTime = raw.eventTime?.trim() || "2026年8月10日 14:00 - 18:00";

  // 5. Standardize fee & quota
  const fee = raw.fee?.trim() || "免费";
  const quota = raw.quota?.trim() || "50人";

  // 6. Standardize intro description
  const intro = raw.intro?.trim() || `${raw.title.trim()}，欢迎杨林高校学子与同城居民踊跃报名参加！地点：${location}。`;

  return {
    oldId,
    title: raw.title.trim(),
    category,
    eventTime,
    location,
    fee,
    quota,
    contact: cleanPhone,
    intro,
    images: raw.images || [],
    status: "APPROVED",
  };
}
