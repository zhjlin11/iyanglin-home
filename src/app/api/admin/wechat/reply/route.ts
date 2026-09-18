import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "wechat_auto_reply";

/**
 * 关键词组结构（与 webhook 端一致）
 */
interface KeywordGroup {
  name: string;
  keywords: string[];
  reply: string;
  enabled?: boolean;
}

interface AutoReplyConfig {
  welcomeMsg: string;
  keywordGroups: KeywordGroup[];
  defaultReply: string;
}

function getDefaults(): AutoReplyConfig {
  return {
    welcomeMsg:
      "👋 欢迎来到【杨林生活网】\n\n" +
      "这里专注杨林镇、杨林大学城、杨林经开区及周边本地生活信息。\n\n" +
      "你可以在这里：\n" +
      "💼 找工作｜查看杨林最新招聘\n" +
      "🏠 找房子｜出租房、二手房、商铺\n" +
      "🛍 找商家｜餐饮、维修、生活服务\n" +
      "🎉 看活动｜同城活动、本地新鲜事\n\n" +
      "直接回复关键词：\n" +
      "招聘 / 房产 / 商家 / 活动 / 发布\n\n" +
      "👉 杨林生活网：https://iyanglin.com\n\n" +
      "在杨林，找工作、找房子、找服务，先来杨林生活网。",
    keywordGroups: [
      {
        name: "招聘",
        keywords: ["招聘", "工作", "找工作", "兼职", "全职", "招工", "求职", "岗位"],
        reply:
          "💼 杨林最新招聘\n\n" +
          "可以查看：\n• 全职岗位\n• 兼职岗位\n• 工厂招聘\n• 门店招聘\n• 杨林大学城招聘\n• 杨林经开区招聘\n\n" +
          "👉 查看最新岗位：\nhttps://iyanglin.com/jobs\n\n岗位持续更新，找工作建议收藏。",
        enabled: true,
      },
      {
        name: "房产",
        keywords: ["房产", "租房", "房子", "找房", "出租", "二手房", "商铺", "门面"],
        reply:
          "🏠 在杨林找房？\n\n" +
          "这里可以查看：\n• 杨林大学城租房\n• 整租 / 合租\n• 房屋出租\n• 二手房\n• 商铺门面\n\n" +
          "👉 查看最新房源：\nhttps://iyanglin.com/house\n\n有房源也可以在杨林生活网发布。",
        enabled: true,
      },
      {
        name: "商家",
        keywords: ["商家", "店铺", "好店", "吃饭", "美食", "维修", "服务", "本地商家", "找店"],
        reply:
          "🛍 找杨林本地商家和服务？\n\n" +
          "可以找：\n• 餐饮美食\n• 酒店住宿\n• 装修建材\n• 汽车服务\n• 电脑维修\n• 家政服务\n• 教育培训\n\n" +
          "👉 查看杨林本地商家：\nhttps://iyanglin.com/haodian",
        enabled: true,
      },
      {
        name: "活动",
        keywords: ["活动", "同城活动", "周末", "去哪玩", "聚会"],
        reply:
          "🎉 杨林最近有什么活动？\n\n" +
          "可以查看：\n• 同城活动\n• 校园活动\n• 商家活动\n• 节庆活动\n• 周末活动\n\n" +
          "👉 查看同城活动：\nhttps://iyanglin.com/active",
        enabled: true,
      },
      {
        name: "资讯",
        keywords: ["资讯", "新闻", "本地新闻", "杨林新闻", "消息", "新鲜事"],
        reply:
          "📰 杨林本地资讯\n\n" +
          "查看：\n• 杨林本地动态\n• 大学城消息\n• 经开区资讯\n• 便民通知\n• 同城新鲜事\n\n" +
          "👉 查看最新资讯：\nhttps://iyanglin.com/articles",
        enabled: true,
      },
      {
        name: "便民",
        keywords: ["便民", "电话", "便民电话", "号码", "查询电话"],
        reply:
          "☎️ 杨林便民服务\n\n" +
          "可以查询：\n• 常用电话\n• 快递服务\n• 生活服务\n• 公共服务\n• 本地便民信息\n\n" +
          "👉 查看便民服务：\nhttps://iyanglin.com/bianmin",
        enabled: true,
      },
      {
        name: "发布",
        keywords: ["发布", "发信息", "发布信息", "我要发布", "投稿", "发招聘", "发房源"],
        reply:
          "✍️ 想在杨林生活网发布信息？\n\n" +
          "可以发布：\n• 招聘信息\n• 房源信息\n• 商家信息\n• 活动信息\n• 便民信息\n• 其他本地信息\n\n" +
          "👉 点击发布：\nhttps://iyanglin.com/publish",
        enabled: true,
      },
      {
        name: "广告",
        keywords: ["广告", "推广", "广告合作", "商家推广", "我要推广", "广告位", "招商"],
        reply:
          "📣 想让更多杨林人看到你的生意？\n\n" +
          "杨林生活网支持：\n• 首页广告\n• 招聘置顶\n• 房产推广\n• 商家推荐\n• 信息流广告\n• 本地品牌宣传\n\n" +
          "👉 查看广告合作方案：\nhttps://iyanglin.com/advertising\n\n也可以直接回复「客服」联系我们。",
        enabled: true,
      },
      {
        name: "客服",
        keywords: ["客服", "联系", "联系电话", "微信", "人工", "人工客服", "帮助"],
        reply:
          "☎️ 联系杨林生活网\n\n" +
          "如需信息咨询、问题反馈、广告合作、商家入驻，请通过以下方式联系：\n\n" +
          "📞 电话：13619694207\n💬 微信：13619694207\n📧 邮箱：123035946@qq.com\n\n" +
          "工作时间：周一至周日 9:00-21:00",
        enabled: true,
      },
      {
        name: "相亲",
        keywords: ["相亲", "交友", "脱单", "找对象"],
        reply:
          "💕 杨林同城相亲交友\n\n" +
          "在这里可以：\n• 浏览同城交友信息\n• 发布自己的交友信息\n• 参加线下交友活动\n\n" +
          "👉 查看同城交友：\nhttps://iyanglin.com/love",
        enabled: true,
      },
      {
        name: "菜单",
        keywords: ["菜单", "你好", "您好", "hi", "hello", "怎么用", "有什么功能"],
        reply:
          "👋 你好，这里是【杨林生活网】\n\n" +
          "直接回复下面关键词：\n\n" +
          "💼 招聘 — 查看最新岗位\n🏠 房产 — 找房、租房\n🛍 商家 — 本地商家服务\n🎉 活动 — 同城活动\n" +
          "📰 资讯 — 本地资讯\n☎️ 便民 — 便民电话\n✍️ 发布 — 发布信息\n📣 广告 — 广告合作\n👩‍💻 客服 — 联系我们\n\n" +
          "👉 https://iyanglin.com",
        enabled: true,
      },
    ],
    defaultReply:
      "没找到对应内容，可以试试回复：\n\n" +
      "招聘 / 房产 / 商家 / 活动\n资讯 / 便民 / 发布 / 广告 / 菜单\n\n" +
      "也可以直接访问：\nhttps://iyanglin.com",
  };
}

/**
 * GET /api/admin/wechat/reply
 * 获取当前自动回复配置（新关键词组格式）
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const defaults = getDefaults();
    let data: AutoReplyConfig = defaults;

    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value);
        if (parsed.keywordGroups) {
          // 新格式
          data = {
            welcomeMsg: parsed.welcomeMsg || defaults.welcomeMsg,
            keywordGroups: parsed.keywordGroups || defaults.keywordGroups,
            defaultReply: parsed.defaultReply || defaults.defaultReply,
          };
        } else if (parsed.keywordRules) {
          // 旧格式 → 自动迁移为新格式
          data = {
            welcomeMsg: parsed.welcomeMsg || defaults.welcomeMsg,
            keywordGroups: parsed.keywordRules.map((r: any) => ({
              name: r.keyword,
              keywords: [r.keyword],
              reply: r.reply,
              enabled: true,
            })),
            defaultReply: parsed.defaultReply || defaults.defaultReply,
          };
        }
      } catch {}
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "获取自动回复配置失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/wechat/reply
 * 保存自动回复配置（新关键词组格式）
 */
export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await req.json() as AutoReplyConfig;

    // 基础校验
    if (!body.welcomeMsg || !body.keywordGroups || !body.defaultReply) {
      return NextResponse.json(
        { error: "缺少必要字段：welcomeMsg、keywordGroups、defaultReply" },
        { status: 400 }
      );
    }

    // 检查关键词冲突
    const allKeywords = new Map<string, string>();
    const conflicts: string[] = [];
    for (const group of body.keywordGroups) {
      for (const kw of group.keywords) {
        const lower = kw.toLowerCase();
        if (allKeywords.has(lower)) {
          conflicts.push(`"${kw}" 同时出现在「${allKeywords.get(lower)}」和「${group.name}」中`);
        } else {
          allKeywords.set(lower, group.name);
        }
      }
    }

    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(body) },
      create: {
        group: "WECHAT",
        key: SETTING_KEY,
        value: JSON.stringify(body),
        valueType: "json",
        description: "微信公众号自动回复配置（关键词组）",
        isPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "自动回复配置已保存，即时生效！",
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "保存失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/wechat/reply
 * 重置为默认配置
 */
export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const defaults = getDefaults();
    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(defaults) },
      create: {
        group: "WECHAT",
        key: SETTING_KEY,
        value: JSON.stringify(defaults),
        valueType: "json",
        description: "微信公众号自动回复配置（关键词组）",
        isPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "已重置为默认配置",
      data: defaults,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "重置失败" },
      { status: 500 }
    );
  }
}
