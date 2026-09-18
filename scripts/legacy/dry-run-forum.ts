import { RawForumInput, normalizeForumRecord, NormalizedForumRecord } from "./forum-normalizer";

const mockLegacyForumData: RawForumInput[] = [
  {
    index: 1,
    title: "【重要公告】关于杨林大学城中央公园公共停车区修缮及通行调整通知",
    board: "官方动态",
    body: "各位杨林同城居民及高校师生：为进一步优化大学城交通秩序与环境，中央公园大草坪周边公共停车场将于本周末进行沥青铺设与划线修缮，期间请大家文明停车、遵守现场引导。",
    images: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"],
    isTop: true,
  },
  {
    index: 2,
    title: "大家知道杨林大学城附近哪里有靠谱的便民快递代收点和干洗店吗？",
    board: "求助问答",
    body: "刚搬到大学城附近住，想打听一下周边有哪几家靠谱的洗鞋干洗店和顺丰快递大站？求邻居们推荐！谢谢大家！",
    images: [],
    isTop: false,
  },
  {
    index: 3,
    title: "分享周末去嵩明长冲山徒步看日落的超棒路线与拍照打卡点！",
    board: "生活闲聊",
    body: "上周末和几个社团小伙伴一起去了长冲山，空气超级清新！建议下午4点开始登顶，刚好能赶上绝美日落。附上全套路线指南与实拍美图！",
    images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"],
    isTop: false,
  },
  {
    index: 4,
    title: "杨林工业园区泰佳鑫园区招聘与企业服务交流讨论帖",
    board: "杨林同城",
    body: "本帖长期汇总杨林工业园区最新企业招聘动态、用工需求与园区配套服务。欢迎园区企业HR与求职者在本帖留言互动！",
    images: ["https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"],
    isTop: true,
  },
];

export async function runForumDryRun() {
  console.log("🧪 正在执行 Stage 5: 社区论坛 (Forum) 离线 Dry Run 模拟清洗转换（零数据库写入）...\n");

  const total = mockLegacyForumData.length;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let missingImageCount = 0;

  const normalizedList: NormalizedForumRecord[] = [];
  const seenOldIds = new Set<string>();

  for (const raw of mockLegacyForumData) {
    try {
      const normalized = normalizeForumRecord(raw);

      if (seenOldIds.has(normalized.oldId)) {
        duplicateCount++;
        continue;
      }
      seenOldIds.add(normalized.oldId);

      if (normalized.images.length === 0) {
        missingImageCount++;
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
  console.log(`- 无配图帖子数: ${missingImageCount}`);

  console.log("\n【标准化样本数据预览 (#1)】");
  console.log(JSON.stringify(normalizedList[0], null, 2));

  console.log("\n--------------------------------------------------");
  return {
    total,
    successCount,
    duplicateCount,
    errorCount,
    missingImageCount,
    normalizedList,
  };
}

if (require.main === module) {
  runForumDryRun();
}
