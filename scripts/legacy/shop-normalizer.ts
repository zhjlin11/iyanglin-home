export interface RawShopInput {
  index: number;
  name: string;
  category?: string;
  address?: string;
  phone?: string;
  hours?: string;
  intro?: string;
  logo?: string;
  images?: string[];
  isFeatured?: boolean;
}

export interface NormalizedShopRecord {
  oldId: string;
  name: string;
  category: string; // food | hotel | supermarket | hardware | car | education | medical | decoration | digital | security | enterprise | service | entertainment | travel | government | other
  address: string;
  phone: string;
  hours: string;
  intro: string;
  logo?: string;
  images: string[];
  status: "APPROVED" | "PENDING";
  isFeatured: boolean;
}

export function normalizeShopRecord(raw: RawShopInput): NormalizedShopRecord {
  const indexStr = String(raw.index).padStart(3, "0");
  const oldId = `LEGACY_SHOP_0723_${indexStr}`;

  // 1. Standardize category
  let category = "food";
  const rawCat = (raw.category || raw.name || "").toLowerCase();
  if (rawCat.includes("酒店") || rawCat.includes("宾馆") || rawCat.includes("客房") || rawCat.includes("住宿")) {
    category = "hotel";
  } else if (rawCat.includes("超市") || rawCat.includes("便利店") || rawCat.includes("生鲜")) {
    category = "supermarket";
  } else if (rawCat.includes("五金") || rawCat.includes("建材")) {
    category = "hardware";
  } else if (rawCat.includes("汽修") || rawCat.includes("洗车") || rawCat.includes("修车")) {
    category = "car";
  } else if (rawCat.includes("培训") || rawCat.includes("驾校") || rawCat.includes("教育")) {
    category = "education";
  } else if (rawCat.includes("诊所") || rawCat.includes("药店") || rawCat.includes("医院") || rawCat.includes("医疗")) {
    category = "medical";
  } else if (rawCat.includes("数码") || rawCat.includes("电脑") || rawCat.includes("营业厅") || rawCat.includes("手机")) {
    category = "digital";
  } else if (rawCat.includes("安防") || rawCat.includes("弱电") || rawCat.includes("监控")) {
    category = "security";
  } else if (rawCat.includes("企业") || rawCat.includes("科技") || rawCat.includes("工贸") || rawCat.includes("公司")) {
    category = "enterprise";
  } else if (rawCat.includes("洗浴") || rawCat.includes("网咖") || rawCat.includes("KTV") || rawCat.includes("娱乐")) {
    category = "entertainment";
  } else if (rawCat.includes("服务") || rawCat.includes("理发") || rawCat.includes("干洗")) {
    category = "service";
  }

  // 2. Standardize address
  let address = raw.address?.trim() || "杨林镇商业区";
  if (!address.includes("杨林") && !address.includes("嵩明")) {
    address = `杨林大学城${address}`;
  }

  // 3. Standardize contact phone
  const rawPhone = raw.phone?.trim() || "";
  let cleanPhone = rawPhone;
  const phoneMatch = rawPhone.match(/1[3-9]\d{9}/);
  if (phoneMatch) {
    cleanPhone = phoneMatch[0];
  }

  // 4. Standardize operating hours
  const hours = raw.hours?.trim() || "08:30 - 21:30";

  // 5. Standardize intro description
  const intro = raw.intro?.trim() || `${raw.name.trim()}，位于${address}，欢迎广大广大顾客光临体验。`;

  return {
    oldId,
    name: raw.name.trim(),
    category,
    address,
    phone: cleanPhone,
    hours,
    intro,
    logo: raw.logo || undefined,
    images: raw.images || [],
    status: "APPROVED",
    isFeatured: Boolean(raw.isFeatured),
  };
}
