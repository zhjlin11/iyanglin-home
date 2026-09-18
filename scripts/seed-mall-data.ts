import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Mall Categories...");
  const categories = [
    { name: "饮料水饮", icon: "🥤", sortOrder: 1 },
    { name: "休闲零食", icon: "🍿", sortOrder: 2 },
    { name: "方便速食", icon: "🍜", sortOrder: 3 },
    { name: "牛奶乳品", icon: "🥛", sortOrder: 4 },
    { name: "日用百货", icon: "🧻", sortOrder: 5 },
    { name: "洗护清洁", icon: "🧼", sortOrder: 6 },
    { name: "文具用品", icon: "✏️", sortOrder: 7 },
    { name: "数码小件", icon: "🔋", sortOrder: 8 },
    { name: "本地特产", icon: "🍯", sortOrder: 9 },
    { name: "其他", icon: "📦", sortOrder: 10 },
  ];

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const record = await prisma.mallCategory.upsert({
      where: { name: c.name },
      update: { icon: c.icon, sortOrder: c.sortOrder, status: "ACTIVE" },
      create: { name: c.name, icon: c.icon, sortOrder: c.sortOrder, status: "ACTIVE" },
    });
    catMap.set(c.name, record.id);
  }

  console.log("Seeding Delivery Zones...");
  const zones = [
    {
      name: "杨林大学城",
      feeCents: 300,
      freeShippingThresholdCents: 2900,
      estimatedMinutes: "25-35分钟",
      sortOrder: 1,
    },
    {
      name: "杨林经开区",
      feeCents: 500,
      freeShippingThresholdCents: 3900,
      estimatedMinutes: "35-45分钟",
      sortOrder: 2,
    },
    {
      name: "杨林镇老街周边",
      feeCents: 200,
      freeShippingThresholdCents: 2000,
      estimatedMinutes: "20-30分钟",
      sortOrder: 3,
    },
    {
      name: "嵩明县城周边",
      feeCents: 1000,
      freeShippingThresholdCents: 6900,
      estimatedMinutes: "45-60分钟",
      sortOrder: 4,
    },
  ];

  for (const z of zones) {
    await prisma.deliveryZone.upsert({
      where: { name: z.name },
      update: z,
      create: z,
    });
  }

  console.log("Seeding Couriers...");
  const couriers = [
    {
      name: "张师傅",
      phone: "13888001001",
      accessCode: "888888",
      remark: "大学城专线骑手 · 熟悉各高校宿舍区",
    },
    {
      name: "李师傅",
      phone: "13888001002",
      accessCode: "888888",
      remark: "园区专送骑手 · 熟悉经开区各大工厂与标准厂房",
    },
  ];

  for (const cr of couriers) {
    await prisma.courier.upsert({
      where: { phone: cr.phone },
      update: cr,
      create: cr,
    });
  }

  console.log("Seeding Convenience Store Products...");
  const sampleProducts = [
    // 饮料水饮
    {
      name: "可口可乐 摩登罐",
      subtitle: "冰爽解渴 经典原味 汽水无间断",
      categoryName: "饮料水饮",
      brand: "可口可乐",
      barcode: "690123400101",
      unit: "听",
      specification: "330ml/听",
      priceCents: 300,
      originalPriceCents: 350,
      costCents: 200,
      stock: 68,
      salesCount: 142,
      isHot: true,
      isFeatured: true,
      coverImage: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "农夫山泉 饮用天然水",
      subtitle: "红盖经典款 大自然的搬运工",
      categoryName: "饮料水饮",
      brand: "农夫山泉",
      barcode: "690123400102",
      unit: "瓶",
      specification: "550ml/瓶",
      priceCents: 200,
      originalPriceCents: 200,
      costCents: 110,
      stock: 120,
      salesCount: 380,
      isHot: true,
      coverImage: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "东方树叶 茉莉花茶",
      subtitle: "0糖0卡0香精 原叶萃取无糖纯茶",
      categoryName: "饮料水饮",
      brand: "农夫山泉",
      barcode: "690123400103",
      unit: "瓶",
      specification: "500ml/瓶",
      priceCents: 500,
      originalPriceCents: 550,
      costCents: 360,
      stock: 45,
      salesCount: 89,
      isNew: true,
      coverImage: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "红牛维生素功能饮料",
      subtitle: "加班备考提神 随时随地能量充沛",
      categoryName: "饮料水饮",
      brand: "红牛",
      barcode: "690123400104",
      unit: "罐",
      specification: "250ml/罐",
      priceCents: 600,
      originalPriceCents: 650,
      costCents: 450,
      stock: 50,
      salesCount: 63,
      coverImage: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
    },

    // 方便速食
    {
      name: "康师傅红烧牛肉面 经典桶装",
      subtitle: "大面饼加量 宿舍夜宵车间加餐标配",
      categoryName: "方便速食",
      brand: "康师傅",
      barcode: "690123400201",
      unit: "桶",
      specification: "108g/桶",
      priceCents: 500,
      originalPriceCents: 550,
      costCents: 350,
      stock: 80,
      salesCount: 210,
      isHot: true,
      coverImage: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "统一老坛酸菜牛肉面 桶装",
      subtitle: "这酸爽才是正宗酸菜味 附带泡椒与酸菜包",
      categoryName: "方便速食",
      brand: "统一",
      barcode: "690123400202",
      unit: "桶",
      specification: "120g/桶",
      priceCents: 500,
      originalPriceCents: 550,
      costCents: 350,
      stock: 55,
      salesCount: 95,
      coverImage: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "双汇王中王 优级火腿肠",
      subtitle: "泡面伴侣 肉质紧实 Q弹香浓",
      categoryName: "方便速食",
      brand: "双汇",
      barcode: "690123400203",
      unit: "袋",
      specification: "30g*10支/袋",
      priceCents: 1200,
      originalPriceCents: 1400,
      costCents: 850,
      stock: 40,
      salesCount: 77,
      coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80",
    },

    // 休闲零食
    {
      name: "乐事无限薯片 原味",
      subtitle: "片片金黄 咔嚓酥脆 罐装便于保存",
      categoryName: "休闲零食",
      brand: "乐事",
      barcode: "690123400301",
      unit: "罐",
      specification: "104g/罐",
      priceCents: 850,
      originalPriceCents: 950,
      costCents: 620,
      stock: 35,
      salesCount: 54,
      isFeatured: true,
      coverImage: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "卫龙大面筋 辣条经典",
      subtitle: "儿时回忆 甜辣过瘾 独立包装干净卫生",
      categoryName: "休闲零食",
      brand: "卫龙",
      barcode: "690123400302",
      unit: "包",
      specification: "65g/包",
      priceCents: 350,
      originalPriceCents: 400,
      costCents: 220,
      stock: 60,
      salesCount: 160,
      isHot: true,
      coverImage: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "奥利奥夹心饼干 原味",
      subtitle: "扭一扭 舔一舔 泡一泡 经典巧克力夹心",
      categoryName: "休闲零食",
      brand: "奥利奥",
      barcode: "690123400303",
      unit: "卷",
      specification: "97g/条",
      priceCents: 650,
      originalPriceCents: 750,
      costCents: 450,
      stock: 42,
      salesCount: 39,
      coverImage: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=80",
    },

    // 牛奶乳品
    {
      name: "蒙牛纯甄 常温原味风味酸奶",
      subtitle: "甄选生牛乳发酵 奶香浓郁 醇厚好口感",
      categoryName: "牛奶乳品",
      brand: "蒙牛",
      barcode: "690123400401",
      unit: "盒",
      specification: "200g/盒",
      priceCents: 550,
      originalPriceCents: 600,
      costCents: 380,
      stock: 48,
      salesCount: 88,
      isFeatured: true,
      coverImage: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "伊利纯牛奶 钻石装",
      subtitle: "优质乳蛋白 每100ml含3.2g优质蛋白质",
      categoryName: "牛奶乳品",
      brand: "伊利",
      barcode: "690123400402",
      unit: "盒",
      specification: "250ml/盒",
      priceCents: 400,
      originalPriceCents: 450,
      costCents: 280,
      stock: 75,
      salesCount: 112,
      coverImage: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
    },

    // 日用百货
    {
      name: "维达超韧抽纸 3层经典款",
      subtitle: "湿水不易破 亲肤无香 原生木浆制作",
      categoryName: "日用百货",
      brand: "维达",
      barcode: "690123400501",
      unit: "包",
      specification: "3层*120抽/包",
      priceCents: 450,
      originalPriceCents: 500,
      costCents: 300,
      stock: 90,
      salesCount: 156,
      isHot: true,
      coverImage: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "心相印 杀菌卫生湿巾",
      subtitle: "杀菌率99.9% 随时擦拭双手手机",
      categoryName: "日用百货",
      brand: "心相印",
      barcode: "690123400502",
      unit: "包",
      specification: "10片便携装",
      priceCents: 300,
      originalPriceCents: 350,
      costCents: 180,
      stock: 85,
      salesCount: 66,
      coverImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    },

    // 洗护清洁
    {
      name: "超能植翠低泡洗衣液 薰衣草香",
      subtitle: "易漂易清 护色护衣 宿舍洗衣大瓶装",
      categoryName: "洗护清洁",
      brand: "超能",
      barcode: "690123400601",
      unit: "瓶",
      specification: "1kg/瓶",
      priceCents: 1890,
      originalPriceCents: 2200,
      costCents: 1350,
      stock: 25,
      salesCount: 31,
      coverImage: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=80",
    },
    {
      name: "晨光按动式中性笔 经典黑",
      subtitle: "出水顺畅 速干不脏手 考试答题顺滑笔芯",
      categoryName: "文具用品",
      brand: "晨光",
      barcode: "690123400701",
      unit: "支",
      specification: "0.5mm 黑色",
      priceCents: 250,
      originalPriceCents: 300,
      costCents: 120,
      stock: 150,
      salesCount: 220,
      isHot: true,
      coverImage: "https://images.unsplash.com/photo-1585336261026-778749e7bdfd?w=500&auto=format&fit=crop&q=80",
    },

    // 数码小件
    {
      name: "倍思 Type-C 6A 快充数据线",
      subtitle: "耐折抗拉尼龙编织 快速充电不发烫",
      categoryName: "数码小件",
      brand: "倍思",
      barcode: "690123400801",
      unit: "条",
      specification: "1米 黑色",
      priceCents: 1590,
      originalPriceCents: 1990,
      costCents: 980,
      stock: 30,
      salesCount: 45,
      isNew: true,
      coverImage: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80",
    },

    // 本地特产
    {
      name: "嵩明杨林肥酒 小酒版体验装",
      subtitle: "非遗古法酿造 绿如翡翠 药香醇厚(到店提/年满18岁)",
      categoryName: "本地特产",
      brand: "杨林肥酒",
      barcode: "690123400901",
      unit: "瓶",
      specification: "100ml 38度",
      priceCents: 2800,
      originalPriceCents: 3200,
      costCents: 2000,
      stock: 18,
      salesCount: 42,
      isFeatured: true,
      coverImage: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=80",
    },

    // 低库存预警商品 (用于测试低库存告警)
    {
      name: "南孚聚能环5号电池 4粒装",
      subtitle: "耐用更持久 强劲动力 遥控器门锁专用",
      categoryName: "日用百货",
      brand: "南孚",
      barcode: "690123400503",
      unit: "板",
      specification: "AA 5号 4粒/板",
      priceCents: 1200,
      originalPriceCents: 1300,
      costCents: 850,
      stock: 3,
      lowStockThreshold: 5,
      salesCount: 19,
      coverImage: "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&auto=format&fit=crop&q=80",
    },

    // 已售罄商品 (用于测试已售罄展示与阻断下单)
    {
      name: "三得利乌龙茶 无糖版",
      subtitle: "经典醇香 特级茶叶添加 0糖0脂肪",
      categoryName: "饮料水饮",
      brand: "三得利",
      barcode: "690123400105",
      unit: "瓶",
      specification: "500ml/瓶",
      priceCents: 500,
      originalPriceCents: 550,
      costCents: 350,
      stock: 0,
      status: "SOLD_OUT",
      salesCount: 88,
      coverImage: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80",
    },
  ];

  for (const p of sampleProducts) {
    const categoryId = catMap.get(p.categoryName);
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({
      where: { barcode: p.barcode },
    });

    const data: any = {
      name: p.name,
      subtitle: p.subtitle,
      categoryId,
      brand: p.brand,
      barcode: p.barcode,
      unit: p.unit,
      specification: p.specification,
      priceCents: p.priceCents,
      originalPriceCents: p.originalPriceCents,
      costCents: p.costCents,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      salesCount: p.salesCount,
      status: p.status || (p.stock > 0 ? "ON_SALE" : "SOLD_OUT"),
      isFeatured: p.isFeatured ?? false,
      isHot: p.isHot ?? false,
      isNew: p.isNew ?? false,
      isSelfOperated: true,
      coverImage: p.coverImage,
      images: [p.coverImage],
      description: `【杨林生活网自营便利店】正品行货，本地现货仓直发，支持到店自提与同城配送。\n\n规格参数：${p.specification}\n品牌：${p.brand}\n售后服务：7天质量问题包退换，如有破损拍照即退。`,
    };

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.product.create({
        data,
      });
    }
  }

  console.log("Mall seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
