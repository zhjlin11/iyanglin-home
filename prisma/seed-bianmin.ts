import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 分类数据
  const categories = [
    { name: "急救报警", icon: "🚨", sortOrder: 1 },
    { name: "政务服务", icon: "🏛️", sortOrder: 2 },
    { name: "水电燃气", icon: "💡", sortOrder: 3 },
    { name: "快递物流", icon: "📦", sortOrder: 4 },
    { name: "医疗健康", icon: "🏥", sortOrder: 5 },
    { name: "教育培训", icon: "🎓", sortOrder: 6 },
    { name: "家政维修", icon: "🔧", sortOrder: 7 },
    { name: "出行交通", icon: "🚗", sortOrder: 8 },
    { name: "外卖餐饮", icon: "🍜", sortOrder: 9 },
    { name: "银行金融", icon: "🏦", sortOrder: 10 },
  ];

  for (const cat of categories) {
    const created = await prisma.phoneCategory.create({ data: cat });

    // 根据分类插入电话数据
    const phones = getPhonesByCategory(cat.name, created.id);
    for (const phone of phones) {
      await prisma.phoneEntry.create({ data: phone });
    }
  }

  console.log("✅ 便民电话种子数据导入完成！");
}

function getPhonesByCategory(categoryName: string, categoryId: string) {
  const data: Record<string, Array<{ name: string; phone: string; address?: string; description?: string; isHot?: boolean }>> = {
    "急救报警": [
      { name: "报警电话", phone: "110", isHot: true, description: "24小时紧急报警" },
      { name: "火警电话", phone: "119", isHot: true, description: "消防火灾报警" },
      { name: "急救电话", phone: "120", isHot: true, description: "医疗急救" },
      { name: "交通事故报警", phone: "122", isHot: true, description: "交通事故处理" },
      { name: "杨林派出所", phone: "0871-67881110", address: "杨林经开区", isHot: true },
      { name: "嵩明县公安局", phone: "0871-67911100", address: "嵩明县城" },
    ],
    "政务服务": [
      { name: "嵩明县政务服务中心", phone: "0871-67914608", address: "嵩明县城嵩阳路" },
      { name: "杨林社区服务中心", phone: "0871-67881003", address: "杨林经开区" },
      { name: "市长热线", phone: "12345", isHot: true, description: "投诉建议热线" },
      { name: "社保咨询", phone: "12333", description: "社保公积金咨询" },
      { name: "杨林市场监管所", phone: "0871-67881315", address: "杨林经开区" },
    ],
    "水电燃气": [
      { name: "供电服务热线", phone: "95598", isHot: true, description: "停电报修/电费查询" },
      { name: "自来水服务热线", phone: "0871-67914380", description: "停水报修/水费查询" },
      { name: "燃气服务热线", phone: "0871-68586110", description: "燃气报修/安检" },
      { name: "有线电视报修", phone: "96599", description: "广电网络服务" },
    ],
    "快递物流": [
      { name: "顺丰快递", phone: "95338", isHot: true },
      { name: "中通快递", phone: "95311" },
      { name: "圆通快递", phone: "95554" },
      { name: "韵达快递", phone: "95546" },
      { name: "申通快递", phone: "95543" },
      { name: "京东物流", phone: "950616" },
      { name: "邮政速递EMS", phone: "11183" },
      { name: "极兔速递", phone: "956025" },
    ],
    "医疗健康": [
      { name: "杨林卫生院", phone: "0871-67881120", address: "杨林镇", isHot: true, description: "基层医疗服务" },
      { name: "嵩明县人民医院", phone: "0871-67911297", address: "嵩明县城", description: "综合性医院" },
      { name: "嵩明县中医院", phone: "0871-67912120", address: "嵩明县城" },
      { name: "心理援助热线", phone: "400-161-9995", description: "24小时心理咨询" },
    ],
    "教育培训": [
      { name: "杨林中心小学", phone: "0871-67881203", address: "杨林镇" },
      { name: "嵩明一中", phone: "0871-67912018", address: "嵩明县城" },
      { name: "云南工商学院(杨林校区)", phone: "0871-67883666", address: "杨林经开区" },
      { name: "教育咨询热线", phone: "0871-67911101", description: "嵩明县教育局" },
    ],
    "家政维修": [
      { name: "杨林开锁换锁", phone: "0871-67881688", address: "杨林镇", description: "24小时上门开锁" },
      { name: "管道疏通", phone: "0871-67881868", address: "杨林镇", description: "下水道疏通、马桶维修" },
      { name: "家电维修", phone: "0871-67882288", address: "杨林镇", description: "空调、冰箱、洗衣机维修" },
      { name: "搬家服务", phone: "0871-67882588", address: "杨林镇" },
    ],
    "出行交通": [
      { name: "高铁/火车订票", phone: "12306", isHot: true },
      { name: "嵩明客运站", phone: "0871-67911289", address: "嵩明县城" },
      { name: "出租车叫车", phone: "0871-96108", description: "昆明市出租车服务" },
      { name: "高速公路救援", phone: "12122", description: "高速公路报警救援" },
      { name: "交通违章查询", phone: "12123", description: "交管12123" },
    ],
    "外卖餐饮": [
      { name: "美团外卖客服", phone: "10107888" },
      { name: "饿了么客服", phone: "10105757" },
      { name: "肯德基(杨林店)", phone: "4009200715", address: "杨林经开区" },
    ],
    "银行金融": [
      { name: "中国银行(杨林支行)", phone: "0871-67883268", address: "杨林经开区" },
      { name: "农业银行(杨林支行)", phone: "0871-67883866", address: "杨林经开区" },
      { name: "建设银行(嵩明支行)", phone: "0871-67912838", address: "嵩明县城" },
      { name: "农村信用社(杨林)", phone: "0871-67881233", address: "杨林镇" },
    ],
  };

  const entries = data[categoryName] || [];
  return entries.map((e, i) => ({
    categoryId,
    name: e.name,
    phone: e.phone,
    address: e.address || null,
    description: e.description || null,
    isHot: e.isHot || false,
    sortOrder: i,
    status: "APPROVED",
  }));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
