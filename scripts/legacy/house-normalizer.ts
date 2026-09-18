export interface RawHouseInput {
  index: number;
  title: string;
  houseType?: string;
  price?: string;
  layout?: string;
  areaSize?: string;
  location?: string;
  contact?: string;
  description?: string;
  images?: string[];
}

export interface NormalizedHouseRecord {
  oldId: string;
  title: string;
  houseType: string; // rent | secondhand | newhouse | shop
  price: string;
  layout: string;
  areaSize: string;
  location: string;
  contact: string;
  body: string;
  images: string[];
  status: "APPROVED" | "PENDING";
}

export function normalizeHouseRecord(raw: RawHouseInput): NormalizedHouseRecord {
  const indexStr = String(raw.index).padStart(3, "0");
  const oldId = `LEGACY_HOUSE_0723_${indexStr}`;

  // 1. Standardize houseType
  let houseType = "rent";
  const rawType = (raw.houseType || "").toLowerCase();
  if (rawType.includes("二手房") || rawType.includes("售房") || rawType.includes("出售")) {
    houseType = "secondhand";
  } else if (rawType.includes("新房") || rawType.includes("楼盘")) {
    houseType = "newhouse";
  } else if (rawType.includes("商铺") || rawType.includes("厂房") || rawType.includes("档口")) {
    houseType = "shop";
  }

  // 2. Standardize price
  let price = raw.price?.trim() || "面议";
  if (price && !price.includes("元") && !price.includes("万") && !isNaN(Number(price))) {
    price = houseType === "rent" ? `${price}元/月` : `${price}万元`;
  }

  // 3. Standardize layout & area
  const layout = raw.layout?.trim() || "不限";
  const areaSize = raw.areaSize?.trim() || "不限";

  // 4. Standardize location
  let location = raw.location?.trim() || "杨林地区";
  if (location.includes("大学城")) location = "杨林大学城";
  else if (location.includes("工业园")) location = "杨林工业园区";

  // 5. Standardize contact phone
  const rawContact = raw.contact?.trim() || "";
  let cleanPhone = "";
  const phoneMatch = rawContact.match(/1[3-9]\d{9}/);
  if (phoneMatch) {
    cleanPhone = phoneMatch[0];
  }

  // 6. Build structured body text
  let cleanDesc = raw.description || "";
  cleanDesc = cleanDesc
    .replace(/【联系电话】[：:]\s*(暂无电话|无|未提供)?/g, "")
    .trim();

  let body = `【房源类型】${houseType === "rent" ? "租房" : houseType === "secondhand" ? "二手房" : "商铺厂房"}`;
  if (price) body += `\n【价格】${price}`;
  if (layout !== "不限") body += `\n【户型】${layout}`;
  if (areaSize !== "不限") body += `\n【面积】${areaSize}`;
  if (location) body += `\n【位置】${location}`;
  if (cleanPhone) body += `\n【联系方式】${cleanPhone}`;
  body += `\n\n【描述】\n${cleanDesc}`;

  return {
    oldId,
    title: raw.title.trim(),
    houseType,
    price,
    layout,
    areaSize,
    location,
    contact: cleanPhone,
    body,
    images: raw.images || [],
    status: "APPROVED",
  };
}
