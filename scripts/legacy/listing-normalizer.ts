export interface RawListingInput {
  index: number;
  title: string;
  category?: string;
  subcategory?: string;
  price?: string;
  location?: string;
  contact?: string;
  description?: string;
  images?: string[];
}

export interface NormalizedListingRecord {
  oldId: string;
  title: string;
  category: string; // ershou | service | car | pet | pinche | qiugou | zhuanrang | life
  contact: string;
  body: string;
  images: string[];
  status: "APPROVED" | "PENDING";
}

export function normalizeListingRecord(raw: RawListingInput): NormalizedListingRecord {
  const indexStr = String(raw.index).padStart(3, "0");
  const oldId = `LEGACY_LISTING_0723_${indexStr}`;

  // 1. Standardize category
  let category = "ershou";
  const rawCat = (raw.category || raw.subcategory || "").toLowerCase();
  if (rawCat.includes("服务") || rawCat.includes("维修") || rawCat.includes("家政")) {
    category = "service";
  } else if (rawCat.includes("车") || rawCat.includes("摩托") || rawCat.includes("电动车")) {
    category = "car";
  } else if (rawCat.includes("宠") || rawCat.includes("猫") || rawCat.includes("狗")) {
    category = "pet";
  } else if (rawCat.includes("拼车") || rawCat.includes("顺风车")) {
    category = "pinche";
  } else if (rawCat.includes("求购")) {
    category = "qiugou";
  } else if (rawCat.includes("转让") || rawCat.includes("铺面")) {
    category = "zhuanrang";
  } else if (rawCat.includes("生活") || rawCat.includes("便民")) {
    category = "life";
  }

  // 2. Standardize contact phone
  const rawContact = raw.contact?.trim() || "";
  let cleanPhone = "";
  const phoneMatch = rawContact.match(/1[3-9]\d{9}/);
  if (phoneMatch) {
    cleanPhone = phoneMatch[0];
  }

  // 3. Standardize price
  let price = raw.price?.trim() || "面议";
  if (price && !price.includes("元") && !price.includes("万") && !isNaN(Number(price))) {
    price = `${price}元`;
  }

  // 4. Build structured body text
  let cleanDesc = raw.description || "";
  cleanDesc = cleanDesc
    .replace(/【联系电话】[：:]\s*(暂无电话|无|未提供)?/g, "")
    .trim();

  let body = `【分类】${category}\n【价格】${price}`;
  if (raw.location) body += `\n【位置】${raw.location.trim()}`;
  if (cleanPhone) body += `\n【联系方式】${cleanPhone}`;
  body += `\n\n【描述】\n${cleanDesc}`;

  return {
    oldId,
    title: raw.title.trim(),
    category,
    contact: cleanPhone,
    body,
    images: raw.images || [],
    status: "APPROVED",
  };
}
