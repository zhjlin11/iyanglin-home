import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { reconcileWechatFollowers, type WechatSyncRow } from "@/lib/wechat-followers";

// 内存缓存微信 Access Token
let cachedToken: { token: string; expiresAt: number } | null = null;

// 内存缓存 JS-SDK Ticket
let cachedJsTicket: { ticket: string; expiresAt: number } | null = null;

export async function getWechatCredentials() {
  // 凭据只能来自部署环境或后台安全配置，禁止在源码中保留密钥兜底值。
  let appId = process.env.WECHAT_MP_APP_ID?.trim() || "";
  let appSecret = process.env.WECHAT_MP_APP_SECRET?.trim() || "";

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["wechat_mp_app_id", "wechat_mp_app_secret"] } },
    });
    settings.forEach((s) => {
      if (!appId && s.key === "wechat_mp_app_id" && s.value) appId = s.value.trim();
      if (!appSecret && s.key === "wechat_mp_app_secret" && s.value) appSecret = s.value.trim();
    });
  } catch {}

  if (!appId || !appSecret) {
    throw new Error("微信公众号 AppID/AppSecret 未配置");
  }

  return { appId, appSecret };
}

/**
 * 获取微信公众号全局 Access Token (带自动缓存与提前5分钟续期机制)
 */
export async function getWechatAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 300 * 1000) {
    return cachedToken.token;
  }

  const { appId, appSecret } = await getWechatCredentials();
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.access_token) {
    cachedToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in || 7200) * 1000,
    };
    return data.access_token;
  }

  throw new Error(`获取微信 Access Token 失败: ${data.errmsg || JSON.stringify(data)}`);
}

/**
 * 分页拉取微信公众号关注者 OpenID 列表
 * @param nextOpenid 首次拉取传空字符串，分页拉取传上一批最后一个 openid
 */
export async function getWechatFollowers(nextOpenid = ""): Promise<{
  total: number;
  count: number;
  openids: string[];
  nextOpenid: string;
}> {
  const token = await getWechatAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${token}${nextOpenid ? `&next_openid=${nextOpenid}` : ""}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode) {
    throw new Error(`拉取微信粉丝列表失败: [${data.errcode}] ${data.errmsg}`);
  }

  return {
    total: data.total || 0,
    count: data.count || 0,
    openids: data.data?.openid || [],
    nextOpenid: data.next_openid || "",
  };
}

/**
 * 批量拉取微信用户基础信息 (每次最多 100 人)
 */
export async function batchGetWechatUserInfo(openids: string[]): Promise<any[]> {
  if (!openids.length) return [];
  const token = await getWechatAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/user/info/batchget?access_token=${token}`;

  const userList = openids.map((oid) => ({ openid: oid, lang: "zh_CN" }));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_list: userList }),
  });

  const data = await res.json();
  if (data.errcode) {
    throw new Error(`批量拉取微信用户信息失败: [${data.errcode}] ${data.errmsg}`);
  }

  return data.user_info_list || [];
}

/**
 * 核心引擎：把微信公众号当前关注名单同步到独立粉丝档案。
 * 不再把粉丝批量创建成网站会员，也不会在全量同步时赠送积分。
 */
export async function syncAllWechatFollowers(): Promise<{
  totalFollowers: number;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  currentFollowers: number;
  linkedFollowers: number;
  unlinkedFollowers: number;
  notFollowingUsers: number;
  totalRecords: number;
}> {
  let nextOpenid = "";
  let totalFollowers = 0;
  const allOpenids: string[] = [];

  do {
    const pageData = await getWechatFollowers(nextOpenid);
    totalFollowers = pageData.total;
    const openids = pageData.openids;

    if (!openids || openids.length === 0) break;
    allOpenids.push(...openids);

    nextOpenid = pageData.nextOpenid;
    if (allOpenids.length >= totalFollowers || !nextOpenid) {
      break;
    }
  } while (nextOpenid);

  const uniqueOpenids = [...new Set(allOpenids)];
  if (uniqueOpenids.length !== totalFollowers) {
    throw new Error(
      `微信关注名单未完整拉取（官方总数 ${totalFollowers}，实际获取 ${uniqueOpenids.length}），已取消本次写入`
    );
  }

  const syncRows: WechatSyncRow[] = [];
  for (let i = 0; i < uniqueOpenids.length; i += 100) {
    const batchOpenids = uniqueOpenids.slice(i, i + 100);
    let userInfoList: any[];
    try {
      userInfoList = await batchGetWechatUserInfo(batchOpenids);
    } catch {
      userInfoList = batchOpenids.map((openId) => ({ openid: openId, subscribe: 1 }));
    }

    const byOpenId = new Map(userInfoList.map((user) => [user.openid, user]));
    for (const openId of batchOpenids) {
      const wxUser = byOpenId.get(openId) || {};
      syncRows.push({
        openId,
        unionId: wxUser.unionid || null,
        nickname: wxUser.nickname || null,
        avatar: wxUser.headimgurl || null,
        subscribeTimeEpoch: Number(wxUser.subscribe_time) || null,
      });
    }
  }

  const result = await reconcileWechatFollowers(syncRows);
  return {
    totalFollowers,
    ...result,
  };
}

/**
 * 发送微信公众号模板消息通知 (审核通知、订单支付成功、求职应聘通知等)
 */
export async function sendWechatTemplateMessage(params: {
  touser: string;
  template_id: string;
  url?: string;
  data: Record<string, { value: string; color?: string }>;
}) {
  const token = await getWechatAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const result = await res.json();
  return result;
}

// ============ JS-SDK 签名 ============

/**
 * 获取 JS-SDK jsapi_ticket（带缓存）
 */
export async function getJsApiTicket(): Promise<string> {
  const now = Date.now();
  if (cachedJsTicket && cachedJsTicket.expiresAt > now + 300 * 1000) {
    return cachedJsTicket.ticket;
  }

  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
  );
  const data = await res.json();

  if (data.ticket) {
    cachedJsTicket = {
      ticket: data.ticket,
      expiresAt: now + (data.expires_in || 7200) * 1000,
    };
    return data.ticket;
  }
  throw new Error(`获取 jsapi_ticket 失败: ${data.errmsg || JSON.stringify(data)}`);
}

/**
 * 生成 JS-SDK 配置签名
 */
export async function getJsSdkConfig(pageUrl: string) {
  const { appId } = await getWechatCredentials();
  const ticket = await getJsApiTicket();
  const nonceStr = crypto.randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${pageUrl}`;
  const signature = crypto.createHash("sha1").update(str).digest("hex");

  return { appId, timestamp, nonceStr, signature };
}

// ============ 自定义菜单管理 ============

export interface WechatMenuButton {
  name: string;
  type?: string;
  url?: string;
  key?: string;
  appid?: string;
  pagepath?: string;
  media_id?: string;
  sub_button?: WechatMenuButton[];
}

export interface WechatMenu {
  button: WechatMenuButton[];
}

/**
 * 获取当前公众号自定义菜单
 */
export async function getWechatMenu(): Promise<WechatMenu> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/menu/get?access_token=${token}`
  );
  const data = await res.json();

  if (data.menu) return data.menu;
  if (data.errcode === 46003) return { button: [] }; // 没有菜单
  throw new Error(`获取公众号菜单失败: ${JSON.stringify(data)}`);
}

/**
 * 创建/更新公众号自定义菜单
 */
export async function createWechatMenu(menu: WechatMenu): Promise<void> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menu),
    }
  );
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(`创建菜单失败: ${JSON.stringify(data)}`);
  }
}

/**
 * 删除公众号自定义菜单
 */
export async function deleteWechatMenu(): Promise<void> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${token}`
  );
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(`删除菜单失败: ${JSON.stringify(data)}`);
  }
}

// ============ 带参数临时二维码（扫码登录 + 用户主动关注确认） ============

/**
 * 创建微信带参数临时二维码
 * 未关注用户扫码后必须先关注公众号 → 触发 subscribe 事件（EventKey 含 qrscene_ 前缀）
 * 已关注用户扫码 → 直接触发 SCAN 事件
 * @param sceneStr 场景值字符串（最长 64 字符）
 * @param expireSeconds 二维码有效期（秒），最长 2592000（30 天）
 */
export async function createTempQrCode(
  sceneStr: string,
  expireSeconds = 300
): Promise<{
  ticket: string;
  url: string;
  expire_seconds: number;
}> {
  const token = await getWechatAccessToken();
  const apiUrl = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${token}`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expire_seconds: expireSeconds,
      action_name: "QR_STR_SCENE",
      action_info: {
        scene: { scene_str: sceneStr },
      },
    }),
  });

  const data = await res.json();
  if (data.errcode) {
    throw new Error(
      `创建临时二维码失败: [${data.errcode}] ${data.errmsg}`
    );
  }

  return {
    ticket: data.ticket,
    url: data.url,
    expire_seconds: data.expire_seconds,
  };
}

// ============ 消息回复 XML 构建 ============

/**
 * 构建文本回复消息 XML
 */
export function buildTextReplyXml(
  toUser: string,
  fromUser: string,
  content: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`;
}

// ============ 获取单个用户信息 ============

/**
 * 通过 openid 获取单个微信用户信息
 */
export async function getWechatUserInfo(openid: string): Promise<any> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${token}&openid=${openid}&lang=zh_CN`
  );
  return await res.json();
}

/**
 * 获取公众号粉丝总数
 */
export async function getFollowerCount(): Promise<number> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/user/get?access_token=${token}`
  );
  const data = await res.json();
  if (data.total !== undefined) return data.total;
  throw new Error(`获取粉丝数失败: ${JSON.stringify(data)}`);
}

/**
 * 发送客服文本消息（支持 <a href="url">文字</a> 超链接）
 * 返回 { errcode, errmsg }
 */
export async function sendCustomTextMessage(
  openid: string,
  content: string
): Promise<{ errcode: number; errmsg: string }> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        touser: openid,
        msgtype: "text",
        text: { content },
      }),
    }
  );
  const data = await res.json();
  if (data.errcode && data.errcode !== 0) {
    console.error("[CustomMsg] Text send failed:", data);
  }
  return { errcode: data.errcode || 0, errmsg: data.errmsg || "ok" };
}

/**
 * 发送客服图文消息（单条图文卡片）
 */
export async function sendCustomNewsMessage(
  openid: string,
  article: { title: string; description: string; url: string; picurl?: string }
): Promise<{ errcode: number; errmsg: string }> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        touser: openid,
        msgtype: "news",
        news: {
          articles: [
            {
              title: article.title,
              description: article.description,
              url: article.url,
              picurl: article.picurl || "",
            },
          ],
        },
      }),
    }
  );
  const data = await res.json();
  if (data.errcode && data.errcode !== 0) {
    console.error("[CustomMsg] News send failed:", data);
  }
  return { errcode: data.errcode || 0, errmsg: data.errmsg || "ok" };
}

/**
 * 发送客服图片消息
 */
export async function sendCustomImageMessage(
  openid: string,
  mediaId: string
): Promise<{ errcode: number; errmsg: string }> {
  const token = await getWechatAccessToken();
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        touser: openid,
        msgtype: "image",
        image: { media_id: mediaId },
      }),
    }
  );
  const data = await res.json();
  if (data.errcode && data.errcode !== 0) {
    console.error("[CustomMsg] Image send failed:", data);
  }
  return { errcode: data.errcode || 0, errmsg: data.errmsg || "ok" };
}
