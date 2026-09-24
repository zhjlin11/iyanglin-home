const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Base timestamp for sequential continuous entry on 2026-09-22
const baseTime = new Date("2026-09-22T00:10:00.000Z"); // 08:10 CST

// List of all items extracted in order from WeChat article https://mp.weixin.qq.com/s/iB62FOGvYKgpRPqGvctjKQ
const items = [
  // ==========================================
  // Item 01: 特种作业与职业技能考试培训
  // ==========================================
  {
    table: "Listing",
    order: 1,
    data: {
      title: "【特种作业考试培训】应急管理局/市监局/住建厅/消防考证培训",
      category: "training",
      subCategory: "职业考证",
      itemType: "OFFER",
      price: "随报随学",
      area: "嵩明县城",
      address: "嵩明及昆明指定考训中心",
      contact: "13888348909",
      contactName: "李老师 / 灵老师 / 丽老师",
      wechat: "13888348909",
      body: `【培训考证类别】
① 应急管理局证书：电工作业、高处作业、焊工作业、矿山主要负责人、安全管理人员（每周五考试）；
② 市场监管局证书：叉车、起重机司机及指挥、锅炉、压力容器、特种设备安全管理（每周四考试）；
③ 消防安全管理人员及中级消防设施操作员（随报随学）；
④ 危化品从业人员及危化品经营生产安全管理人员、危化工艺、制冷与空调（每月一期）；
⑤ 电梯T证（电梯维修维护）；
⑥ 住建厅安全管理A证和C证、八大员；
⑦ 住建厅普工、特工（电工焊工架子工）；
⑧ 电工、人力资源、养老护理、保育员，中级及高级技能证书；
⑨ 公安局发保安员证（每周四考试）；
⑩ 心理咨询师、家庭教育指导师（随报随学）。

【咨询电话】
李老师：13888348909
灵老师：15887151353
丽老师：13658841280`,
    },
  },

  // ==========================================
  // Item 03: 一般工贸企业安全咨询服务与台账
  // ==========================================
  {
    table: "Listing",
    order: 3,
    data: {
      title: "【企业安全咨询】一般工贸企业安全生产七大类合规台账编制与咨询",
      category: "service",
      subCategory: "企业企服",
      itemType: "OFFER",
      price: "面议",
      area: "杨林经开区",
      address: "嵩明杨林经开区及各工业园区",
      contact: "13888348909",
      contactName: "李老师",
      wechat: "13888348909",
      body: `【服务范围】专业协助一般工贸企业建立健全安全生产全套规范台账：
1. 基础管理类台账：安全生产责任制、安全生产规章制度与操作规程、安全管理机构及人员、安全生产会议台账、安全生产投入费用台账；
2. 风险管控类台账：危险源辨识与评估台账、危险作业审批台账（动火/受限空间/高处/临电）、风险告知台账；
3. 隐患排查治理类台账：日常与专项排查台账、隐患整改闭环通知书、重大隐患挂牌督办方案；
4. 教育培训类台账：年度/季度安全培训计划、新员工三级安全教育记录、特种作业取证/复审台账；
5. 应急管理类台账：综合/专项应急预案与现场处置方案文本、应急演练记录、应急物资台账、应急队伍台账；
6. 事故管理类台账：事故报告台账、调查处理取证台账、工伤认定与赔付记录；
7. 设备设施管理类台账：消防/防雷防静电/通风除尘安全设施台账、特种设备定检报告校准台账、劳保防护用品台账。

【咨询电话】李老师 13888348909`,
    },
  },

  // ==========================================
  // Item 04: 职业圈企业用工与人力资源法律咨询
  // ==========================================
  {
    table: "Listing",
    order: 4,
    data: {
      title: "【人力资源法务】企业劳动合同签订、规章制度规范与工伤争议咨询",
      category: "service",
      subCategory: "企业企服",
      itemType: "OFFER",
      price: "面议",
      area: "杨林工业园",
      address: "嵩明县杨林工业园区",
      contact: "13888348909",
      contactName: "法务咨询处",
      wechat: "13888348909",
      body: `【职业圈人力资源法律咨询服务】
1. 指导企业根据用工性质签订合规的《劳动合同》、《劳务合同》、《劳务用工协议》、《返聘协议》；
2. 指导和提供合规且适当规避风险的社会保险缴纳优化方案；
3. 指导企业制定合法合理并适当规避用工风险的工资薪酬项目组成；
4. 辞退、处罚、开除员工前后合规流程咨询服务；
5. 员工发生工伤后的处置与申报咨询；
6. 发生或潜在劳动争议的前期化解与咨询服务；
7. 其他企业生产经营中不涉及诉讼的日常法律事务咨询（由执业律师解答）。

【咨询电话】13888348909`,
    },
  },

  // ==========================================
  // Item 05: 快递驿站整体转让
  // ==========================================
  {
    table: "House",
    order: 5,
    data: {
      title: "【生意转让】杨林大学城汇尔佳超市拼多多快递驿站整体转让",
      houseType: "shop",
      price: "面议",
      layout: "成熟商铺",
      areaSize: "50㎡",
      location: "杨林大学城",
      contact: "17787445704",
      body: `【转让信息】因个人另有发展无暇打理，现将盈利中快递驿站整体转让！
1. 业务稳定：每日派件日均300-400票，收件量稳定，合作快递渠道资源顺畅无罚款；
2. 配套完备：全套快递出入库扫码设备齐全，一人即可轻松经营，装修完好，房租低，无需额外投入；
3. 固定客流：成熟商圈，客源稳定，经营模式成型，新手可全程带教上手；
4. 包含内容：含全套设备、现有客源、稳定快递合作渠道，非诚勿扰。

【店铺地址】嵩明县杨林大学城汇尔佳超市拼多多驿站
【联系电话】17787445704 / 13888087024`,
    },
  },

  // ==========================================
  // Item 06: 滇池学院超市内水果区/简餐合作招商
  // ==========================================
  {
    table: "Listing",
    order: 6,
    data: {
      title: "【招商联营】滇池学院超市内水果区域、特色简餐合作商招募",
      category: "business",
      subCategory: "招商合作",
      itemType: "OFFER",
      price: "面议",
      area: "杨林大学城",
      address: "杨林大学城滇池学院校内超市",
      contact: "15808803088",
      contactName: "汤总",
      wechat: "",
      body: `【合作详情】
滇池学院校内超市水果区域招合作商、特色简餐合作商！
1. 超市独家经营，无恶性竞品，消费群体持续稳定；
2. 校园常驻在校学生1.7万人左右，青年消费力强，客单量高；
3. 适合经验丰富的水果生鲜商户、优质简餐快餐轻食餐饮老板。

【联系人】汤总 15808803088
【地点】杨林大学城滇池学院校内超市`,
    },
  },

  // ==========================================
  // Item 07: 求租厂房 1200平带航车大车进出
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 7,
    data: {
      title: "【企业急求租】求租杨林带航车厂房1200㎡左右 (进出大车带办公室)",
      description: "急求租杨林经开区或工业园区厂房，面积1200平方米左右，要求：必须带天车/航车，可方便进出17.5米大货车，配套有办公区域。",
      propertyType: "FACTORY",
      transactionType: "WANTED_RENT",
      region: "杨林经开区",
      address: "杨林经开区 / 工业园周边",
      buildingArea: 1200,
      hasCrane: true,
      hasOffice: true,
      truckAccessible: true,
      contactName: "燕子",
      contactPhone: "18349361720",
    },
  },

  // ==========================================
  // Item 08: 嵩明隆源美食城后大门铺面转让
  // ==========================================
  {
    table: "House",
    order: 8,
    data: {
      title: "【店铺转让】嵩明隆源美食城后大门黄金商铺60㎡转让",
      houseType: "shop",
      price: "面议",
      layout: "餐饮门面",
      areaSize: "60㎡",
      location: "嵩明县城",
      contact: "13888903053",
      body: `【商铺转让详情】
1. 位于嵩明隆源美食城（后大门）黄金铺面，人流动线集中；
2. 面积60平方米，餐饮水电气齐全，适合风味特色小吃、特色快餐、烧烤排档等；
3. 有意者请直接电话联系。

【位置】嵩明隆源美食城后大门
【联系人】彭女士 13888903053`,
    },
  },

  // ==========================================
  // Item 09: 官军路鹰之天重卡充电站厂房分租800-1000平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 9,
    data: {
      title: "【厂房分租】杨林经开区官军路鹰之天重卡充电站旁厂房800-1000㎡出租",
      description: "厂房位于嵩明县杨林经济技术开发区官军路与国道213交叉口鹰之天重卡充电站内，交通极其便利，大货车进出极便。现对外分租厂房800-1000平米，价格实惠面谈，适合仓储加工、货运中转。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林经开区",
      address: "杨林经济技术开发区官军路与国道213交叉口",
      buildingArea: 1000,
      truckAccessible: true,
      contactName: "艾总 / 谢师",
      contactPhone: "13099988991",
    },
  },

  // ==========================================
  // Item 10: 云南纳硕EPE珍珠棉生产包装厂家
  // ==========================================
  {
    table: "Shop",
    order: 10,
    data: {
      name: "云南纳硕包装材料有限公司 (EPE珍珠棉生产基地)",
      category: "service",
      address: "嵩明县杨林镇美迎和睦创业园10栋",
      phone: "15129792260",
      hours: "08:00 - 18:00",
      intro: "专业生产EPE珍珠棉二十余年，厂区占地15000平方米。自主全流程生产异形定位型材、包装卷材、加厚板材，支持来图来样开模加工。广泛应用于电子五金、仪器门窗、家居物流及生鲜水果防震抗摔包装，供货稳定性价比高。",
    },
  },

  // ==========================================
  // Item 11: 清凯财务嵩明分公司
  // ==========================================
  {
    table: "Shop",
    order: 11,
    data: {
      name: "清凯财务总公司 (嵩明分公司)",
      category: "service",
      address: "嵩明县嵩阳街道药灵路城市印象38号商铺",
      phone: "18987115285",
      hours: "08:30 - 18:00",
      intro: "一站式企业财税服务：公司注册、代理记账、出口退税、税收筹划、商标注册、财务外包、股权设计、公司转让、审计税审、高新项目申报、资质代办、政府会计与人事代理。全昆明设嵩明、呈贡、安宁多分公司。",
    },
  },

  // ==========================================
  // Item 12: 燃放身材管理嵩明店
  // ==========================================
  {
    table: "Shop",
    order: 12,
    data: {
      name: "燃放身材管理 (嵩明滨河馨苑店)",
      category: "service",
      address: "嵩明县城滨河馨苑6栋2单元11楼",
      phone: "17898728212",
      hours: "09:00 - 20:00",
      intro: "专注科学健康减脂塑形，不节食、不伤身，科学打造易瘦体质。专业方案月度减脂8-20斤不反弹，全国连锁品牌全程扶持，欢迎到店咨询体验。",
    },
  },

  // ==========================================
  // Item 13: 嵩明↔昆明长期往返顺风车
  // ==========================================
  {
    table: "Listing",
    order: 13,
    data: {
      title: "【顺风车队】嵩明⇄昆明长期双向往返顺风车 (两人即发/50元位含路费)",
      category: "carpool",
      subCategory: "跨城顺风车",
      itemType: "OFFER",
      price: "50元/位",
      priceNum: 50,
      priceUnit: "元/位",
      area: "嵩明县城",
      address: "嵩明县城各主要站点 / 昆明各区指定接送点",
      contact: "15969467648",
      contactName: "陈师傅 / 诸师傅 / 杨师傅",
      departureTime: "全天多班次灵活发车",
      fromPlace: "嵩明县城 / 杨林经开区 / 大学城",
      toPlace: "昆明市区 / 高铁站 / 机场",
      body: `【嵩明↔昆明长期顺风车路线】
1. 路线：嵩明⇄昆明（往返双向均可直达）；
2. 规则：两人即发车，无需久等，随叫随约，灵活便捷；
3. 价格：50元/位（包含全程高速过路费，无任何隐形附加费）；
4. 优势：多台良好车况自备车长期稳定接单，专职老司机文明安全，日常通勤、办事出差、假期返乡首选！

【联系司机】
陈师傅：15969467648
诸师傅：13759542010
杨师傅：13678773517`,
    },
  },

  // ==========================================
  // Item 14: 嵩明人事局小区三室一厅住宅出租 700元/月
  // ==========================================
  {
    table: "House",
    order: 14,
    data: {
      title: "【住宅出租】嵩明县人事局小区三室一厅110㎡ (兰茂广场对面/700元月)",
      houseType: "rent",
      price: "700元/月",
      layout: "3室1厅",
      areaSize: "110㎡",
      location: "嵩明县城",
      contact: "13888184720",
      body: `【房源详情】
1. 位置：嵩明县人事局小区住宅一套，位于嵩明兰茂广场正对面，黄金地段，出行购物极便利；
2. 户型：六楼，面积110平方米左右，三室一厅一厨一卫；
3. 配套：通水电，家具齐全，拎包入住，采光通风好；
4. 租金：超高性价比，每月仅需 700元！

【联系电话】13888184720 / 13708883383`,
    },
  },

  // ==========================================
  // Item 15: 杨林经开区金湖路8号标准厂房1100平 12元/平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 15,
    data: {
      title: "【标准厂房出租】杨林经开区金湖路8号独院标准厂房1100㎡ (配办公室宿舍)",
      description: "杨林经开区金湖路8号标准厂房1100平米出租。临靠经开区主干道，大货车、挂车进出方便，大车停放免费。水电气网络等配套完善，带独立办公室和员工宿舍，适合机械制造、生产加工与仓储物流。租金：12元/平方。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林经开区",
      address: "杨林经开区金湖路8号",
      buildingArea: 1100,
      rentPrice: 12,
      priceUnit: "元/㎡/月",
      hasOffice: true,
      hasDormitory: true,
      truckAccessible: true,
      contactName: "厂房招商部",
      contactPhone: "13354984595",
    },
  },

  // ==========================================
  // Item 16: 浙商产业园标准厂房2200平+住房500平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 16,
    data: {
      title: "【厂房出租】杨林经开区浙商产业园标准厂房2200㎡＋生活住房500㎡",
      description: "浙商产业园区标准厂房出租。厂房主体面积2200平方米，配套生活住宿用房500平方米。所有规划及消防手续齐全，道路宽阔大货车直达车间，适合各类生产制造、装配、纸业及五金加工。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林经开区",
      address: "杨林开发区浙商产业园区",
      buildingArea: 2700,
      factoryArea: 2200,
      hasDormitory: true,
      truckAccessible: true,
      contactName: "毛先生",
      contactPhone: "13987643579",
    },
  },

  // ==========================================
  // Item 17: 嵩明震海家具制造二期优质厂房出租
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 17,
    data: {
      title: "【优质厂房出租】杨林镇震海家具制造二期手续齐全标准厂房 (可整租分租)",
      description: "嵩明震海家具制造有限公司二期厂房招租。证件齐全，消防验收合格。面积灵活可整租可分租；临近主干道，货车进出便利；水电配套完善，带办公区域；适合生产、加工、仓储及电商物流。价格实惠非诚勿扰。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林镇",
      address: "嵩明县杨林镇嵩明震海家具制造有限公司二期",
      buildingArea: 2000,
      hasOffice: true,
      hasFireSystem: true,
      truckAccessible: true,
      canSplit: true,
      contactName: "袁总",
      contactPhone: "13987615550",
    },
  },

  // ==========================================
  // Item 18: 杨林开发区南环路门窗配件供应商
  // ==========================================
  {
    table: "Shop",
    order: 18,
    data: {
      name: "杨林开发区门窗配套供应链服务商",
      category: "service",
      address: "嵩明县杨林开发区南环路",
      phone: "18768671113",
      hours: "08:00 - 18:00",
      intro: "专业门窗配件服务供应商，主营批发：融海隔热条、优诺风高品质隔热条、易豪轩金刚网、高透网及门窗密封附件，货源充足供货快速。",
    },
  },

  // ==========================================
  // Item 19: 嵩明小街工业园标准厂房3500+1500平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 19,
    data: {
      title: "【新建厂房出租】嵩明小街工业园1号3500㎡、2号1500㎡厂房 (带航车可分租)",
      description: "嵩明小街工业园区新建标准厂房招租。一号厂房3500平方米，二号厂房1500平方米，带行车天车，新建完工。园区环境干净整洁，租金支付方式灵活可详谈，可分开出租。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "嵩明小街",
      address: "嵩明县小街镇工业园区",
      buildingArea: 5000,
      hasCrane: true,
      truckAccessible: true,
      canSplit: true,
      contactName: "蒋主管",
      contactPhone: "18087556695",
    },
  },

  // ==========================================
  // Item 20: 昆明海盛园艺有限公司
  // ==========================================
  {
    table: "Shop",
    order: 20,
    data: {
      name: "昆明海盛园艺有限公司",
      category: "service",
      address: "嵩明县现代花卉农业科技园区",
      phone: "0871-67911688",
      hours: "08:30 - 17:30",
      intro: "专业从事高品质鲜切花、花卉种苗繁育与现代农业园艺设施运营，长期吸纳本地人才就业，支持多岗位线上观摩与咨询。",
    },
  },

  // ==========================================
  // Item 21: 金丽源起重设备
  // ==========================================
  {
    table: "Shop",
    order: 21,
    data: {
      name: "金丽源起重设备销售与维修服务中心",
      category: "service",
      address: "嵩明县杨林开发区官军路与天水路交叉口路东50米",
      phone: "15969425585",
      hours: "08:00 - 18:30",
      intro: "专业经营：单双梁桥式、门式、悬挂式起重机，电动葫芦，液压升降货梯。承接起重机年度定检、维护保养、遥控器调试、高强钢丝绳及各种起重机零配件供应。",
    },
  },

  // ==========================================
  // Item 22: 欧派大家居店面升级换样一折特卖
  // ==========================================
  {
    table: "Listing",
    order: 22,
    data: {
      title: "【样板换新】欧派大家居店面升级重装！精品展示样板1折起限量特卖",
      category: "secondhand",
      subCategory: "家居建材",
      itemType: "FOR_SALE",
      price: "1折起",
      area: "嵩明县城",
      address: "阳先公路16号华裕家居建材城二楼欧派大家居",
      contact: "18788489721",
      contactName: "门店负责人",
      wechat: "",
      body: `【店面升级重装特惠】
华裕家居建材城欧派大家居店面升级换样，高品质定制衣柜、橱柜、整体样板家具清仓处理！
1. 折扣力度：正品欧派展厅样件，价格一折起！
2. 数量有限，先到先得，适合正在装修新房或出租屋配齐家具的业主朋友。

【地址】阳先公路16号华裕家居建材城二楼欧派大家居
【联系电话】18788489721`,
    },
  },

  // ==========================================
  // Item 23: 杨林大学城学府康城房东直租三房
  // ==========================================
  {
    table: "House",
    order: 23,
    data: {
      title: "【房东直租】杨林大学城学府康城1栋黄金楼层精装三房 (带家电家具)",
      houseType: "rent",
      price: "面议",
      layout: "3室2厅",
      areaSize: "115㎡",
      location: "杨林大学城",
      contact: "13698708385",
      body: `【学府康城房东直租】
1. 位置：杨林大学城学府康城小区1栋2单元黄金楼层；
2. 户型：精致三房，采光通透，前后无遮挡；
3. 配套：全套家具家电齐全（沙发、茶几、餐桌椅、冰箱、洗衣机、热水器），拎包即住；
4. 适合大学城教师、企业高管或家庭居住，无中介费。

【联系电话/微信】13698708385`,
    },
  },

  // ==========================================
  // Item 24: 云南虹华园艺有限公司 (龙头名企)
  // ==========================================
  {
    table: "Shop",
    order: 24,
    data: {
      name: "云南虹华园艺有限公司",
      category: "service",
      address: "嵩明县现代农业科技示范园区",
      phone: "0871-67971888",
      hours: "08:30 - 17:30",
      intro: "成立于1991年，亚洲最大菊花种苗繁育基地。年产菊花种苗6亿株、切花菊1.5亿枝，出口日本份额占其进口量42%以上。连续三年荣获'云南省十大名花'第一名，嵩明现代绿色农业标杆名企。",
    },
  },

  // ==========================================
  // Item 27: 云南国起特种作业车4S店维修
  // ==========================================
  {
    table: "Shop",
    order: 27,
    data: {
      name: "云南国起特种工程机械维修服务有限公司 (徐工特种作业车4S店)",
      category: "service",
      address: "嵩明县杨嵩大道与官军路交叉路口",
      phone: "13888004567",
      hours: "08:00 - 19:00",
      intro: "徐工集团特种起重作业车4S店，中联重科、三一重工合作单位及各大保险公司定点合作修理厂。专业承接吊车、桥检车、高空作业车、随车吊、泵车、清障车等大型液压工程机械的专业维修与保养。",
    },
  },

  // ==========================================
  // Item 28: 花众锦同城花礼
  // ==========================================
  {
    table: "Shop",
    order: 28,
    data: {
      name: "花众锦同城鲜花礼品定制中心",
      category: "service",
      address: "嵩明县城及杨林大学城配送覆盖",
      phone: "13888348909",
      hours: "08:30 - 21:00",
      intro: "全球精选新鲜花材每日直达，专业花艺师定制专属花礼（生日开业花篮、浪漫告白花束、绿植盆栽），支持一键下单同城专人极速速递。",
    },
  },

  // ==========================================
  // Item 29: 云南华国科技有限公司 (光伏支架)
  // ==========================================
  {
    table: "Shop",
    order: 29,
    data: {
      name: "云南华国科技有限公司 (光伏支架与电力铁塔制造基地)",
      category: "service",
      address: "嵩明县杨林工业园区装备制造区",
      phone: "0871-67975888",
      hours: "08:00 - 18:00",
      intro: "注册资本11986万元，专注于光伏支架、电力铁塔、通信铁塔一体化制造。拥有国内先进全自动及半自动光伏支架生产线100余条，员工500余名，为华能、三峡、国家电网、南方电网等大型央企核心供应商。",
    },
  },

  // ==========================================
  // Item 30: 云南芯宜科技有限公司 (珍珠棉)
  // ==========================================
  {
    table: "Shop",
    order: 30,
    data: {
      name: "云南芯宜科技有限公司 (珍珠棉设计与生产基地)",
      category: "service",
      address: "昆明市嵩明县杨林经开区先进制造业园",
      phone: "0871-67988666",
      hours: "08:00 - 18:00",
      intro: "厂房面积4800平方米，拥有大型220主机及自动分切机等20余台专业设备。专业生产EPE珍珠棉板材、管材、异型定位内衬，SGS环保认证，产品畅销省内外及出口日韩美欧。",
    },
  },

  // ==========================================
  // Item 31: 昆明安天塑胶制品有限公司
  // ==========================================
  {
    table: "Shop",
    order: 31,
    data: {
      name: "昆明安天塑胶制品有限公司",
      category: "service",
      address: "嵩明县杨林经开区包装产业园区",
      phone: "0871-67979111",
      hours: "08:00 - 18:00",
      intro: "从事珍珠棉深加工20年，生产EPE高发泡布、地板舒适地垫、门窗保护膜及家电精密仪器缓冲包装，配有快捷物流体系配送上门。",
    },
  },

  // ==========================================
  // Item 32: 嵩明璟诚财务咨询有限公司
  // ==========================================
  {
    table: "Shop",
    order: 32,
    data: {
      name: "嵩明璟诚财务咨询有限公司",
      category: "service",
      address: "嵩明县嵩阳街道滨河苑B区16号商铺",
      phone: "13888878102",
      hours: "08:30 - 18:00",
      intro: "全流程财税管家：公司注册、记账报税、税务合规、风险体检、审计汇算与企业定制化服务，专业透明，助力嵩明中小企业稳健发展。",
    },
  },

  // ==========================================
  // Item 33: 云南迅聚设备有限公司 (消防管道加工)
  // ==========================================
  {
    table: "Shop",
    order: 33,
    data: {
      name: "云南迅聚消防设备工程制造有限公司",
      category: "service",
      address: "嵩明县牛栏江镇四营村委会龙喜村4号厂区",
      phone: "18288787865",
      hours: "08:00 - 18:00",
      intro: "消防管道加工行业创新型企业，提供消防工程方案设计、图纸审查、高品质材料采购加工、现场安装调试及竣工验收全系统综合服务。",
    },
  },

  // ==========================================
  // Item 34: 求租嵩明/杨林防潮设备仓库 150-200平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 34,
    data: {
      title: "【急求租仓库】求租杨林或小街防潮防鼠设备存放仓库150-200㎡",
      description: "客户急求租仓库，面积150-200平米左右，要求：必须防潮、防鼠，主要用于存放日常不常用的机械设备配件。区域限定在嵩明杨林或小街镇附近，有合适场地房东请联系庞先生。",
      propertyType: "WAREHOUSE",
      transactionType: "WANTED_RENT",
      region: "杨林经开区",
      address: "嵩明县杨林工业园或小街工业区",
      buildingArea: 180,
      contactName: "庞先生",
      contactPhone: "18388087315",
    },
  },

  // ==========================================
  // Item 35: 嵩明隆源农贸市场夜市黄金摊位转让
  // ==========================================
  {
    table: "House",
    order: 35,
    data: {
      title: "【摊位转让】嵩明隆源农贸市场夜市热门经营摊位转让",
      houseType: "shop",
      price: "面议",
      layout: "夜市摊位",
      areaSize: "15㎡",
      location: "嵩明县城",
      contact: "13698747778",
      body: `【摊位转让信息】
1. 现将嵩明隆源农贸市场夜市成熟摊位转让；
2. 位置优越，处于夜市核心通道，客流如潮，晚间烟火气极浓；
3. 适合冷饮冰粉、烧烤炸串、特色卤味、生鲜果品经营，接手即可出摊营运。

【联系电话】13698747778`,
    },
  },

  // ==========================================
  // Item 36: 嵩明占地960平带建筑480平综合场地出租
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 36,
    data: {
      title: "【场地出租】嵩明占地960㎡独院场地 (建筑480㎡+花园/租金3.8万年)",
      description: "嵩明独院综合场地对外出租。占地总面积960平米，建筑面积480平米，配套花园面积20平米左右，水电齐全。租金仅3.8万元/年，三年连租享额外优惠，适合仓储加工、园林农家乐、私家会所办公等。",
      propertyType: "OTHER",
      transactionType: "RENT",
      region: "嵩明县城",
      address: "嵩明县城近郊",
      buildingArea: 480,
      landArea: 960,
      rentPrice: 38000,
      priceUnit: "元/年",
      truckAccessible: true,
      contactName: "场地业主",
      contactPhone: "13769110091",
    },
  },

  // ==========================================
  // Item 37: 嵩阳一小假日港湾旁精装两居室 800元/月
  // ==========================================
  {
    table: "House",
    order: 37,
    data: {
      title: "【住宅出租】嵩阳一小旁假日港湾精装两室两厅 (家私齐全/免物管费800元月)",
      houseType: "rent",
      price: "800元/月",
      layout: "2室2厅",
      areaSize: "85㎡",
      location: "嵩明县城",
      contact: "13888284768",
      body: `【房源介绍】
1. 位置：嵩明县嵩阳一小附近、假日港湾旁，学区与生活氛围优越；
2. 户型：精装两室两厅一厨一卫，采光视野极好；
3. 配套：带舒适双人床、沙发、电视柜、大衣柜，干净舒适；
4. 租金：无物业管理费，每月仅需 800元！欢迎随时看房。

【联系电话】13888284768`,
    },
  },

  // ==========================================
  // Item 38: 领秀知识城一期45平南向房源出售
  // ==========================================
  {
    table: "House",
    order: 38,
    data: {
      title: "【个人二手房出售】领秀知识城一期45㎡南向高层一室 (产权清晰证在手带家具)",
      houseType: "secondhand",
      price: "面议 (首付低可按揭)",
      layout: "1室1厅",
      areaSize: "45㎡",
      location: "嵩明县城",
      contact: "13698708385",
      body: `【房源出售详情】
1. 小区：嵩明领秀知识城一期高层住宅；
2. 户型与面积：一室一厅，建筑面积45平方米，位于20楼黄金高层，纯南向朝向，阳光充足，采光与视野无敌；
3. 产权情况：个人一手产权房，产权清晰，房产证在手，因工作搬家诚意出售；
4. 交付状态：带全套家具家电出售，省去添置成本；首付门槛低，支持商业贷款与公积金贷款。

【联系电话/微信】13698708385`,
    },
  },

  // ==========================================
  // Item 39: 生酮健康饮食与营养咨询
  // ==========================================
  {
    table: "Listing",
    order: 39,
    data: {
      title: "【健康咨询】生酮营养抗老化与科学新陈代谢改善咨询服务",
      category: "service",
      subCategory: "健康咨询",
      itemType: "OFFER",
      price: "面议",
      area: "嵩明县城",
      address: "嵩明县城全域服务",
      contact: "15969409284",
      contactName: "营养咨询师",
      wechat: "",
      body: `【服务特色】倡导科学健康的膳食管理体系：
1. 科学搭配优质油脂与蛋白质营养，增强饱腹感与体能状态；
2. 辅导改善日常新陈代谢、稳定健康状态；
3. 0违禁添加、0反式脂肪酸健康理念普及。

【咨询热线】15969409284`,
    },
  },

  // ==========================================
  // Item 40: 鸿满园药膳庄
  // ==========================================
  {
    table: "Shop",
    order: 40,
    data: {
      name: "鸿满园生态药膳庄",
      category: "food",
      address: "嵩明县生态农业示范区",
      phone: "13529193908",
      hours: "10:00 - 21:00",
      intro: "主营正宗家养散养土鸡滋补药膳、生态无公害绿色时鲜蔬菜采摘体验。亲临庄园现场摘菜、洗菜、柴火土灶烹饪，让您体验原汁原味的田园康养美食乐趣！",
    },
  },

  // ==========================================
  // Item 41: 杨林经开区20000平厂房可分租 8元/平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 41,
    data: {
      title: "【超大厂房出租】杨林经开区20000㎡重型工业厂房 (大小可分/带行车水电/8元㎡)",
      description: "杨林经开区大型工业园厂房整体对外出租。总面积达20000平方米，可根据企业实际需求按1000平、2000平、5000平等大小分割出租。车间内配备多台大吨位天车行车，大容量工业用电通达，水源充沛，大挂车出入极其便捷。租金仅 8元/平方米，适合重工制造、钢结构、装配式建筑及大型物流仓储。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林经开区",
      address: "杨林工业开发区核心干道",
      buildingArea: 20000,
      rentPrice: 8,
      priceUnit: "元/㎡/月",
      hasCrane: true,
      canSplit: true,
      truckAccessible: true,
      contactName: "招商处",
      contactPhone: "15096651780",
    },
  },

  // ==========================================
  // Item 42: 新建厂房7600平+办公楼600平租售
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 42,
    data: {
      title: "【新建厂房租售】新建单层钢结构厂房7600㎡(高12.5米)＋3层办公楼600㎡",
      description: "新建大型现代工业厂房隆重对外出租或出售。规格尺寸：长130米，宽54米，高12.5米超高空间，厂房单层面积7600平米左右；配套独立三层现代化办公大楼600平米。价格便宜实惠，大企业总部制造首选！",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林经开区",
      address: "杨林经济开发区先进制造园",
      buildingArea: 8200,
      factoryArea: 7600,
      officeArea: 600,
      floorHeight: 12.5,
      hasOffice: true,
      truckAccessible: true,
      contactName: "唐总 / 胡总",
      contactPhone: "13888117046",
    },
  },

  // ==========================================
  // Item 43: 五龍道精品商务酒店
  // ==========================================
  {
    table: "Shop",
    order: 43,
    data: {
      name: "五龍道精品商务酒店",
      category: "service",
      address: "嵩明县杨林镇官军路龙保中心 (龙保菜市场对面)",
      phone: "18087178652",
      hours: "24小时营业",
      intro: "坐拥杨林经开区核心商圈，共计89间豪华舒心客房，配套独立卫浴、高速WiFi、恒温热水与免费营养早餐。周边大型超市餐饮聚集，商务出差、探亲访友、接待住宿最优选。",
    },
  },

  // ==========================================
  // Item 44: 杨林大学城里外里酒吧低价转让
  // ==========================================
  {
    table: "House",
    order: 44,
    data: {
      title: "【旺铺转让】杨林大学城中心里外里商业街200㎡超大舞台特色酒吧低价转让",
      houseType: "shop",
      price: "低价转让 (面议)",
      layout: "休闲音乐酒吧",
      areaSize: "200㎡",
      location: "杨林大学城",
      contact: "18788409138",
      body: `【酒吧转让详情】
1. 位置：杨林大学城核心商圈“里外里商业中心”，万名大学生人流必经之地；
2. 空间设施：200平米阔绰空间，拥有杨林最大的专属音乐舞台，配设15张独立卡座散台；
3. 经营现状：独特文艺装修风格，酒水性价比高，学生常客稳定，周末几乎爆满；
4. 转让原因：因店主工作异地调动，无暇兼顾，现低价整店转让（含音响灯光舞台设备）。

【联系电话】曹先生 18788409138`,
    },
  },

  // ==========================================
  // Item 45: 震海家具二期七号厂房2000平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 45,
    data: {
      title: "【单层钢构厂房】杨林镇震海家具制造二期7号厂房2000㎡出租 (层高8米)",
      description: "位于嵩明县杨林镇嵩明震海家具制造有限公司二期七号厂房对外出租。面积整跨2000平方米，单层重型钢结构，层高8米净高，厂房前大操场道路宽敞开阔，环境整洁，适合大型物流仓储配货或规上企业生产。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林镇",
      address: "嵩明县杨林镇震海家具制造有限公司二期7号",
      buildingArea: 2000,
      floorHeight: 8,
      isSingleFloor: true,
      truckAccessible: true,
      contactName: "林总",
      contactPhone: "18080950945",
    },
  },

  // ==========================================
  // Item 46: 急求租20亩以上非农建设用地
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 46,
    data: {
      title: "【场地寻租】急求租嵩明杨林20亩以上非农建设用地 (可租3年以上进大车)",
      description: "寻租人急寻嵩明县域或杨林工业园周边土地：要求面积在20亩以上，土地性质必须为合法非农建设用地，产权清晰无纠纷，租赁期限可在3年以上，大型重卡牵引车可方便驶入驶出。有地块资源的村委或业主请速联系王先生。",
      propertyType: "LAND",
      transactionType: "WANTED_RENT",
      region: "杨林工业园",
      address: "嵩明县及杨林工业园区周边",
      landArea: 20, // 20亩
      contactName: "王先生",
      contactPhone: "13771135516",
    },
  },

  // ==========================================
  // Item 47: 临街铺面低至19000元/年起 高6米
  // ==========================================
  {
    table: "House",
    order: 47,
    data: {
      title: "【商铺招租】优质临街黄金铺面低至19000元/年起 (高6米可搭两层做巨型门头)",
      houseType: "shop",
      price: "19000元/年起",
      layout: "临街商铺",
      areaSize: "50-200㎡",
      location: "嵩明县城",
      contact: "15812006204",
      body: `【临街商铺招商招租】
1. 租金优势：超低门槛进驻，临街独立铺面仅需 19000元/间/年 起；
2. 客流地段：临主干道路，人流车流密集，车辆进出停放极为宽裕；
3. 结构空间：室内层高达到6米，可轻松现浇隔两层使用，使用面积翻倍；
4. 配套与广告：水电齐全，门头可打造超大视觉展示巨型广告牌，面积可按需自由组合分割！

【招商电话】赵经理 15812006204`,
    },
  },

  // ==========================================
  // Item 48: 嵩明县第二人民医院对面厂房1000-8000平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 48,
    data: {
      title: "【园区厂房招租】嵩明县第二人民医院对面杨林检测站旁1000-8000㎡厂房 (高9米)",
      description: "嵩明县第二人民医院正对面、杨林机动车检测站旁标准工业厂房火热招租中！面积1000至8000平方米自由搭配，层高9米通透无遮挡，水电气全通，货运客车进出道路平坦通畅，欢迎实体老板考察洽谈。",
      propertyType: "FACTORY",
      transactionType: "RENT",
      region: "杨林经开区",
      address: "嵩明县第二人民医院对面 (杨林机动车检测站旁)",
      buildingArea: 8000,
      floorHeight: 9,
      truckAccessible: true,
      canSplit: true,
      contactName: "赵女士",
      contactPhone: "15812006204",
    },
  },

  // ==========================================
  // Item 49: 杨林经开区管委会办公楼出租 30-60平
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 49,
    data: {
      title: "【写字楼出租】杨林经开区管委会办公大楼3楼/4楼精装办公室 (单间30-60㎡)",
      description: "杨林经开区管委会办公大楼三楼、四楼对外招租。单间面积30-60平方米，带全新办公桌椅，配套公共大会议室、商务接待室。环境舒适典雅，交通停车极为方便，水电网络一应俱全，园区企服零距离！",
      propertyType: "OFFICE",
      transactionType: "RENT",
      region: "杨林经开区",
      address: "嵩明县杨林经开区管委会办公大楼三层、四层",
      officeArea: 60,
      hasOffice: true,
      contactName: "冯师",
      contactPhone: "13888829622",
    },
  },

  // ==========================================
  // Item 50: 云南德香酒业
  // ==========================================
  {
    table: "Shop",
    order: 50,
    data: {
      name: "云南德香酒业有限公司 (嵩明酒文化体验馆)",
      category: "food",
      address: "嵩明县城文化展示街区",
      phone: "13577032879",
      hours: "09:00 - 20:00",
      intro: "秉承嵩明百年传统酿造工艺，重现百家立灶、千村飘香盛景。主营传统纯粮酿造白酒、特色礼品酒品鉴与订购，欢迎酒界同仁与爱酒雅士莅临品鉴。",
    },
  },

  // ==========================================
  // Item 51: 杨桥上大庄公路边大仓储场地出租
  // ==========================================
  {
    table: "IndustrialProperty",
    order: 51,
    data: {
      title: "【仓储基地出租】杨桥上大庄公路边仓储物流场地 (11米高仓600㎡+小仓300㎡+住宿)",
      description: "位于嵩明县杨桥镇上大庄路边，距杨嵩大道杨桥街口出口仅600米。含11米超高双层大仓库600平米、小仓库300平米、职工住宿500平米、独门大场院可停多辆17.5米大车。通水电，带员工厨房，交通区位绝佳。",
      propertyType: "WAREHOUSE",
      transactionType: "RENT",
      region: "嵩明杨桥",
      address: "嵩明县杨桥镇上大庄路边 (距杨嵩大道出口600米)",
      buildingArea: 1400,
      factoryArea: 900,
      floorHeight: 11,
      hasDormitory: true,
      truckAccessible: true,
      contactName: "诸经理",
      contactPhone: "13888207032",
    },
  },
];

async function run() {
  console.log(`Starting sequential classifieds import (${items.length} items)...`);

  let countHouse = 0;
  let countIndustrial = 0;
  let countListing = 0;
  let countShop = 0;
  let skipped = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const timestamp = new Date(baseTime.getTime() + idx * 8 * 60 * 1000); // Stagger by 8 minutes

    try {
      if (item.table === "IndustrialProperty") {
        // Check duplicate
        const exist = await prisma.industrialProperty.findFirst({
          where: { title: item.data.title },
        });
        if (exist) {
          console.log(`[SKIP] IndustrialProperty: ${item.data.title}`);
          skipped++;
          continue;
        }

        const res = await prisma.industrialProperty.create({
          data: {
            ...item.data,
            status: "PUBLISHED",
            createdAt: timestamp,
            updatedAt: timestamp,
            publishedAt: timestamp,
          },
        });
        countIndustrial++;
        console.log(`[OK #0${item.order}] IndustrialProperty -> ${res.id}: ${res.title}`);
      } else if (item.table === "House") {
        const exist = await prisma.house.findFirst({
          where: { title: item.data.title },
        });
        if (exist) {
          console.log(`[SKIP] House: ${item.data.title}`);
          skipped++;
          continue;
        }

        const res = await prisma.house.create({
          data: {
            ...item.data,
            status: "APPROVED",
            isTop: false,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
        countHouse++;
        console.log(`[OK #0${item.order}] House -> ${res.id}: ${res.title}`);
      } else if (item.table === "Listing") {
        const exist = await prisma.listing.findFirst({
          where: { title: item.data.title },
        });
        if (exist) {
          console.log(`[SKIP] Listing: ${item.data.title}`);
          skipped++;
          continue;
        }

        const res = await prisma.listing.create({
          data: {
            ...item.data,
            status: "APPROVED",
            isTop: false,
            refreshedAt: timestamp,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
        countListing++;
        console.log(`[OK #0${item.order}] Listing -> ${res.id}: ${res.title}`);
      } else if (item.table === "Shop") {
        const exist = await prisma.shop.findFirst({
          where: { name: item.data.name },
        });
        if (exist) {
          console.log(`[SKIP] Shop: ${item.data.name}`);
          skipped++;
          continue;
        }

        const res = await prisma.shop.create({
          data: {
            ...item.data,
            status: "APPROVED",
            isTop: false,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
        countShop++;
        console.log(`[OK #0${item.order}] Shop -> ${res.id}: ${res.name}`);
      }
    } catch (err) {
      console.error(`[ERROR #0${item.order}]`, err);
    }
  }

  console.log("\n==========================================");
  console.log("Classifieds Import Summary:");
  console.log(`- 园区招商 (IndustrialProperty): ${countIndustrial} 条`);
  console.log(`- 房产楼市 (House):              ${countHouse} 条`);
  console.log(`- 综合信息 (Listing):            ${countListing} 条`);
  console.log(`- 好店名录 (Shop):               ${countShop} 条`);
  console.log(`- 跳过重复 (Skipped):            ${skipped} 条`);
  console.log(`- 总计录入 (Total Inserted):     ${countIndustrial + countHouse + countListing + countShop} 条`);
  console.log("==========================================");
}

run()
  .catch((e) => {
    console.error("Script error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
