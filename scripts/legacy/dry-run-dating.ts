import { RawDatingInput, normalizeDatingRecord, NormalizedDatingRecord } from "./dating-normalizer";

const mockLegacyDatingData: RawDatingInput[] = [
  {
    index: 1,
    nickname: "林小晚",
    gender: "女",
    age: "26岁",
    birthYear: 2000,
    heightCm: "165cm",
    education: "本科",
    occupation: "大学城某高校英语教师",
    income: "7000-10000元/月",
    maritalStatus: "未婚",
    location: "杨林大学城",
    requirement: "希望男方年龄在26-32岁，身高175cm以上，有稳定工作，性格包容体贴，无不良嗜好。",
    intro: "性格温和随和，平时喜欢烘焙、弹琴和看电影。希望能在这座美丽的大学城遇到对的人。",
    photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800"],
    contact: "13888771122",
  },
  {
    index: 2,
    nickname: "张先生",
    gender: "男",
    age: "29岁",
    birthYear: 1997,
    heightCm: "178cm",
    education: "硕士",
    occupation: "工业园区自动化工程师",
    income: "12000+元/月",
    maritalStatus: "未婚",
    location: "杨林工业园区",
    requirement: "希望女方性格善良、三观一致，最好也在昆明或嵩明本地工作发展。",
    intro: "热爱生活与户外运动，在杨林已购自住房。为人诚实靠谱，渴望建立温暖的小家庭。",
    photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"],
    contact: "15911224455",
  },
  {
    index: 3,
    nickname: "陈思语",
    gender: "女",
    age: "28岁",
    birthYear: 1998,
    heightCm: "162cm",
    education: "本科",
    occupation: "医院护师",
    income: "6000-9000元/月",
    maritalStatus: "未婚",
    location: "嵩明县城",
    requirement: "希望对方有上进心、顾家、注重沟通，工作生活稳定。",
    intro: "工作认真严谨，生活里是个爱笑的女孩。喜欢做饭和旅游，希望能共同经营美好的未来。",
    photos: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800"],
    contact: "13708899887",
  },
  {
    index: 4,
    nickname: "陆博远",
    gender: "男",
    age: "31岁",
    birthYear: 1995,
    heightCm: "180cm",
    education: "本科",
    occupation: "建筑设计主管",
    income: "15000+元/月",
    maritalStatus: "离异",
    location: "杨林大学城",
    requirement: "成熟理智，相互理解支持，不介意离异状态，沟通畅通。",
    intro: "事业成熟稳定，注重生活品质。坦诚面对过去，期待真诚互信的新感情。",
    photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800"],
    contact: "13987654321",
  },
];

export async function runDatingDryRun() {
  console.log("🧪 正在执行 Stage 5: 相亲交友 (Dating) 离线 Dry Run 模拟清洗转换（零数据库写入）...\n");

  const total = mockLegacyDatingData.length;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let missingPhotoCount = 0;
  let validPhoneCount = 0;

  const normalizedList: NormalizedDatingRecord[] = [];
  const seenOldIds = new Set<string>();

  for (const raw of mockLegacyDatingData) {
    try {
      const normalized = normalizeDatingRecord(raw);

      if (seenOldIds.has(normalized.oldId)) {
        duplicateCount++;
        continue;
      }
      seenOldIds.add(normalized.oldId);

      if (normalized.photos.length === 0) {
        missingPhotoCount++;
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
  console.log(`- 无照片相亲资料数: ${missingPhotoCount}`);
  console.log(`- 有效 11 位手机号覆盖率: ${validPhoneCount} / ${total} (${((validPhoneCount / total) * 100).toFixed(1)}%)`);

  console.log("\n【标准化样本数据预览 (#1)】");
  console.log(JSON.stringify(normalizedList[0], null, 2));

  console.log("\n--------------------------------------------------");
  return {
    total,
    successCount,
    duplicateCount,
    errorCount,
    missingPhotoCount,
    validPhoneCount,
    normalizedList,
  };
}

if (require.main === module) {
  runDatingDryRun();
}
