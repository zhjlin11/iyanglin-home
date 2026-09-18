import { RawShopInput, normalizeShopRecord, NormalizedShopRecord } from "./shop-normalizer";

const mockLegacyShopData: RawShopInput[] = [
  {
    index: 1,
    name: "云南泰佳鑫标准厂房园区管理中心",
    category: "企业服务",
    address: "杨林工业园区泰佳鑫标准厂房1栋",
    phone: "15911317539",
    hours: "08:30 - 18:00",
    intro: "专业提供标准工业厂房租赁、物业管理、园区招商与配套企业服务。交通便利，电力配额充足。",
    logo: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400",
    images: ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800"],
    isFeatured: true,
  },
  {
    index: 2,
    name: "嵩明锦和酒店",
    category: "酒店住宿",
    address: "杨林镇忠兴港苑商业街101号",
    phone: "13888990011",
    hours: "00:00 - 24:00 (24小时营业)",
    intro: "酒店拥有各类豪华大床房、标准间及商务套房，配备高速无线Wi-Fi、独立卫浴与冷暖空调，环境优雅洁净。",
    logo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800"],
    isFeatured: true,
  },
  {
    index: 3,
    name: "忠兴港苑中国移动沟通100营业厅",
    category: "电脑数码",
    address: "杨林大学城忠兴港苑步行街中心",
    phone: "15911317539",
    hours: "09:00 - 20:00",
    intro: "办理中国移动宽带开户、手机号卡续费、5G套餐办理及各大品牌智能手机现货销售与售后维修。",
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"],
    isFeatured: false,
  },
  {
    index: 4,
    title: "杨林大学城极客咖啡馆",
    name: "杨林大学城极客咖啡馆",
    category: "餐饮美食",
    address: "杨林大学城文旅风情街8号",
    phone: "13987654321",
    hours: "10:00 - 22:30",
    intro: "专注手冲精品咖啡、现烘焙甜点与轻食简餐。店内设有安静自习区、免费高速网路与萌猫互动区。",
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800"],
    isFeatured: true,
  } as any,
];

export async function runShopDryRun() {
  console.log("🧪 正在执行 Stage 5: 商家黄页 (Shop) 离线 Dry Run 模拟清洗转换（零数据库写入）...\n");

  const total = mockLegacyShopData.length;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let missingLogoCount = 0;
  let missingImageCount = 0;
  let validPhoneCount = 0;

  const normalizedList: NormalizedShopRecord[] = [];
  const seenOldIds = new Set<string>();

  for (const raw of mockLegacyShopData) {
    try {
      const normalized = normalizeShopRecord(raw);

      if (seenOldIds.has(normalized.oldId)) {
        duplicateCount++;
        continue;
      }
      seenOldIds.add(normalized.oldId);

      if (!normalized.logo) {
        missingLogoCount++;
      }

      if (normalized.images.length === 0) {
        missingImageCount++;
      }

      if (normalized.phone && normalized.phone.length >= 7) {
        validPhoneCount++;
      }

      normalizedList.push(normalized);
      successCount++;
    } catch (err) {
      errorCount++;
    }
  }

  console.log("=== 第五阶段：Dry Run 转换统计结果 ===");
  console.log(`- 原始扫描总记录数: ${total}`);
  console.log(`- 成功解析与标准化数: ${successCount}`);
  console.log(`- 重复记录数: ${duplicateCount}`);
  console.log(`- 转换失败/异常数: ${errorCount}`);
  console.log(`- 无 Logo 商家数: ${missingLogoCount}`);
  console.log(`- 无图库商家数: ${missingImageCount}`);
  console.log(`- 有效电话覆盖率: ${validPhoneCount} / ${total} (${((validPhoneCount / total) * 100).toFixed(1)}%)`);

  console.log("\n【标准化样本数据预览 (#1)】");
  console.log(JSON.stringify(normalizedList[0], null, 2));

  console.log("\n--------------------------------------------------");
  return {
    total,
    successCount,
    duplicateCount,
    errorCount,
    missingLogoCount,
    missingImageCount,
    validPhoneCount,
    normalizedList,
  };
}

if (require.main === module) {
  runShopDryRun();
}
