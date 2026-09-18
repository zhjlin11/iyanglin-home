import { RawListingInput, normalizeListingRecord, NormalizedListingRecord } from "./listing-normalizer";

const mockLegacyListingData: RawListingInput[] = [
  {
    index: 1,
    title: "99新九号电动车小牛90公里超长续航九成新低价急甩",
    category: "车辆买卖",
    price: "1800元",
    location: "杨林大学城",
    contact: "13988776655",
    description: "毕业出车！今年3月刚买的九号E100电动车，续航实测90公里以上，带有GPS防盗和原厂充电器，发票齐全。看车在云南工商学院正门。",
    images: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800"],
  },
  {
    index: 2,
    title: "杨林本地电脑空调专业上门维修清洗移机服务",
    category: "本地服务",
    price: "50元起",
    location: "杨林全区",
    contact: "15911223344",
    description: "专业承接杨林大学城及工业园区各种品牌空调清洗、加氟、拆装移机、电脑组装修理、网络布线。15分钟快速上门，价格透明。",
    images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800"],
  },
  {
    index: 3,
    title: "可爱3个月英短蓝猫寻有爱心主人爱猫人士领养/低价转",
    category: "宠物同城",
    price: "600元",
    location: "杨林镇",
    contact: "13708889911",
    description: "自家猫咪产下的英短蓝猫幼崽，已做首针疫苗和驱虫，性格超级温顺粘人，送猫砂盆和一周猫粮。",
    images: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800"],
  },
  {
    index: 4,
    title: "求购九成新二手iPad Air 5或Pro 2021款学生备考用",
    category: "求购",
    price: "2500元以内",
    location: "杨林大学城",
    contact: "13800112233",
    description: "诚心求购一台二手iPad用于考研看课记笔记，要求无拆无修屏幕完好，最好带Pencil手写笔。大学城内可面交试机。",
    images: [],
  },
];

export async function runListingDryRun() {
  console.log("🧪 正在执行 Stage 5: 分类信息 (Listing) 离线 Dry Run 模拟清洗转换（零数据库写入）...\n");

  const total = mockLegacyListingData.length;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let missingImageCount = 0;
  let validPhoneCount = 0;

  const normalizedList: NormalizedListingRecord[] = [];
  const seenOldIds = new Set<string>();

  for (const raw of mockLegacyListingData) {
    try {
      const normalized = normalizeListingRecord(raw);

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

  console.log("=== 第五阶段：Dry Run 转换统计结果 ===");
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
  runListingDryRun();
}
