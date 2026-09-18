import { RawHouseInput, normalizeHouseRecord, NormalizedHouseRecord } from "./house-normalizer";

// Sample offline historical House datasets scanned from legacy assets
const mockLegacyHouseData: RawHouseInput[] = [
  {
    index: 1,
    title: "杨林大学城教职工精装两居室整租 (配齐全套家电)",
    houseType: "租房",
    price: "1500元/月",
    layout: "2室1厅1卫",
    areaSize: "78㎡",
    location: "杨林大学城",
    contact: "13888123456",
    description: "位于大学城核心地段，采光极佳，小区环境安静安全，家具家电齐全，拎包入住。适合老师或学生合租。",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
  },
  {
    index: 2,
    title: "杨林工业园区泰佳鑫标准厂房仓库招租",
    houseType: "厂房",
    price: "面议",
    layout: "独栋厂房",
    areaSize: "1200㎡",
    location: "杨林工业园区",
    contact: "15911317539",
    description: "独栋标准工业厂房，层高8米，配有大容量变压器及消防设施，大卡车进出方便，适合制造加工或仓储物流。",
    images: ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800"],
  },
  {
    index: 3,
    title: "嵩明锦和尚品品质三房满二急售",
    houseType: "二手房",
    price: "68万元",
    layout: "3室2厅2卫",
    areaSize: "115㎡",
    location: "嵩明县城",
    contact: "13708899887",
    description: "精装修自住品质，南北通透，产权清晰无抵押，因业主换房诚意急售，随时预约看房。",
    images: [],
  },
  {
    index: 4,
    title: "杨林大学城商业街黄金地段餐饮铺面出租",
    houseType: "商铺",
    price: "3500元/月",
    layout: "沿街一楼",
    areaSize: "45㎡",
    location: "杨林大学城",
    contact: "13987654321",
    description: "大学城商业街核心位置，人流量巨大，接手即可营业，适合做餐饮、奶茶或零食店。",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"],
  },
];

export async function runHouseDryRun() {
  console.log("🧪 正在执行 Stage 4: 房产楼市 (House) 离线 Dry Run 模拟清洗转换（零数据库写入）...\n");

  const total = mockLegacyHouseData.length;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let missingImageCount = 0;
  let validPhoneCount = 0;

  const normalizedList: NormalizedHouseRecord[] = [];
  const seenOldIds = new Set<string>();

  for (const raw of mockLegacyHouseData) {
    try {
      const normalized = normalizeHouseRecord(raw);

      if (seenOldIds.has(normalized.oldId)) {
        duplicateCount++;
        continue;
      }
      seenOldIds.add(normalized.oldId);

      if (normalized.images.length === 0) {
        missingImageCount++;
      }

      if (normalized.contact && normalized.contact.length === 11) {
        validPhoneCount++;
      }

      normalizedList.push(normalized);
      successCount++;
    } catch (err) {
      errorCount++;
    }
  }

  console.log("=== 第四阶段：Dry Run 转换统计结果 ===");
  console.log(`- 原始扫描总记录数: ${total}`);
  console.log(`- 成功解析与标准化数: ${successCount}`);
  console.log(`- 重复记录数: ${duplicateCount}`);
  console.log(`- 转换失败/异常数: ${errorCount}`);
  console.log(`- 无图片记录数: ${missingImageCount}`);
  console.log(`- 有效 11 位手机号覆盖率: ${validPhoneCount} / ${total} (${((validPhoneCount / total) * 100).toFixed(1)}%)`);

  console.log("\n【标准化样本数据预览 (#1)】");
  console.log(JSON.stringify(normalizedList[0], null, 2));

  console.log("\n--------------------------------------------------");
  return {
    total,
    successCount,
    duplicateCount,
    errorCount,
    missingImageCount,
    validPhoneCount,
    normalizedList,
  };
}

if (require.main === module) {
  runHouseDryRun();
}
