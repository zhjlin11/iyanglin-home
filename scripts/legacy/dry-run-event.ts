import { RawEventInput, normalizeEventRecord, NormalizedEventRecord } from "./event-normalizer";

const mockLegacyEventData: RawEventInput[] = [
  {
    index: 1,
    title: "杨林大学城草坪露营与电竞交流会",
    category: "精致露营",
    eventTime: "2026年8月10日 14:00 - 18:00",
    location: "杨林大学城中央公园大草坪",
    fee: "免费",
    quota: "40人",
    contact: "13987654321",
    intro: "这是一场专为杨林大学城学子举办的露营与户外电竞交流活动！自备帐篷与设备，共享夏日好时光。",
    images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"],
  },
  {
    index: 2,
    title: "【官方社团】杨林大学城周末户外徒步与古镇采风活动",
    category: "户外徒步",
    eventTime: "2026年8月15日 08:30 - 17:00",
    location: "嵩明长冲山及古镇文化街",
    fee: "AA制 (预计30元)",
    quota: "30人",
    contact: "13888112233",
    intro: "探索嵩明长冲山风光，感受古镇文化魅力，提供专业领队与户外保险。适合喜欢摄影与健身的青年伙伴。",
    images: ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"],
  },
  {
    index: 3,
    title: "2026年杨林工业园区专场人才招聘会与就业指导讲座",
    category: "招聘会",
    eventTime: "2026年8月20日 09:00 - 16:00",
    location: "杨林大学城体育馆主馆",
    fee: "免费参会",
    quota: "不限人次",
    contact: "15911317539",
    intro: "汇集工业园区50余家知名优质企业，提供1000+热门岗位，现场提供简历修改与就业政策咨询。",
    images: ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"],
  },
  {
    index: 4,
    title: "杨林大学城高校王者荣耀&和平精英同城电竞联赛",
    category: "电竞交流",
    eventTime: "2026年8月25日 13:00 - 21:00",
    location: "杨林大学城极客网咖二楼专区",
    fee: "10元/人 (含饮品)",
    quota: "16支战队",
    contact: "13708899887",
    intro: "同城竞技，巅峰对决！冠亚军战队可获得丰厚奖金与外设大奖，现场全程大屏直播与专业解说。",
    images: ["https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800"],
  },
];

export async function runEventDryRun() {
  console.log("🧪 正在执行 Stage 5: 同城活动 (Event) 离线 Dry Run 模拟清洗转换（零数据库写入）...\n");

  const total = mockLegacyEventData.length;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let missingImageCount = 0;
  let validPhoneCount = 0;

  const normalizedList: NormalizedEventRecord[] = [];
  const seenOldIds = new Set<string>();

  for (const raw of mockLegacyEventData) {
    try {
      const normalized = normalizeEventRecord(raw);

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
  console.log(`- 无图库活动数: ${missingImageCount}`);
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
  runEventDryRun();
}
