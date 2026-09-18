import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

import { upsertWechatFollower, markWechatUnsubscribed } from "@/lib/wechat-followers";
import { getWechatAccessToken } from "@/lib/wechat-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const signature = searchParams.get("signature") || "";
  const timestamp = searchParams.get("timestamp") || "";
  const nonce = searchParams.get("nonce") || "";
  const echostr = searchParams.get("echostr") || "";

  const token = process.env.WECHAT_MP_TOKEN || "yanglin_token_2026";
  const arr = [token, timestamp, nonce].sort();
  const hash = crypto.createHash("sha1").update(arr.join("")).digest("hex");

  if (hash === signature) {
    return new NextResponse(echostr);
  }
  return new NextResponse("Invalid signature", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawXml = await req.text();
    const toUser = rawXml.match(/<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/)?.[1] || "";
    const fromUser = rawXml.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/)?.[1] || "";
    const msgType = rawXml.match(/<MsgType><!\[CDATA\[(.*?)\]\]><\/MsgType>/)?.[1] || "";
    const event = rawXml.match(/<Event><!\[CDATA\[(.*?)\]\]><\/Event>/)?.[1] || "";
    const content = rawXml.match(/<Content><!\[CDATA\[(.*?)\]\]><\/Content>/)?.[1]?.trim() || "";

    let replyContent = "您好！欢迎使用杨林生活网官方服务号。回复【招聘】、【租房】、【厂房】、【维修】、【商城】或【客服】即可获取本地直达服务。";

    if (msgType === "event") {
      const evLower = event.toLowerCase();
      if (evLower === "subscribe") {
        try {
          let nickname: string | null = null;
          let avatar: string | null = null;
          let unionId: string | null = null;

          try {
            const accessToken = await getWechatAccessToken();
            const res = await fetch(
              `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${accessToken}&openid=${fromUser}&lang=zh_CN`
            );
            const uInfo = await res.json();
            if (uInfo && !uInfo.errcode) {
              nickname = uInfo.nickname || null;
              avatar = uInfo.headimgurl || null;
              unionId = uInfo.unionid || null;
            }
          } catch (fetchErr) {
            console.error("[WECHAT_SUBSCRIBE_FETCH_ERR]", fetchErr);
          }

          await upsertWechatFollower({
            openId: fromUser,
            unionId,
            nickname,
            avatar,
            subscribed: true,
            subscribeTime: new Date(),
            firstSeenSource: "SUBSCRIBE_EVENT",
          });
        } catch (err) {
          console.error("[WECHAT_SUBSCRIBE_EVENT_ERR]", err);
        }

        replyContent = "您好！欢迎关注杨林生活网 🎉\n\n杨林经开区与大学城一站式同城便民服务平台！\n\n👉 点击进入官网：https://iyanglin.com\n\n📌 找工作求职、租房买房、二手便民、厂房招商一应俱全！\n回复【招聘】、【租房】、【厂房】、【维修】或【客服】即可获取直达服务。";
      } else if (evLower === "unsubscribe") {
        try {
          await markWechatUnsubscribed(fromUser);
        } catch (err) {
          console.error("[WECHAT_UNSUBSCRIBE_EVENT_ERR]", err);
        }
        return new NextResponse("success");
      }
    } else if (msgType === "text") {
      const lower = content.toLowerCase();
      if (lower.includes("招聘") || lower.includes("工作") || lower.includes("找活")) {
        replyContent = "【杨林求职招聘大厅】\n汇聚杨林经开区与大学城 2,300+ 真实企业岗位！\n点击查看最新工作：https://iyanglin.com/jobs";
      } else if (lower.includes("租房") || lower.includes("房子") || lower.includes("买房")) {
        replyContent = "【杨林房产楼市】\n精选大学城单间直租、经开区套房及商铺门面！\n点击挑选房源：https://iyanglin.com/house";
      } else if (lower.includes("厂房") || lower.includes("园区") || lower.includes("招商") || lower.includes("仓库")) {
        replyContent = "【园区招商与工业地产】\n杨林经开区标准化钢结构厂房、独栋研发楼租售！\n点击直达园区：https://iyanglin.com/industrial";
      } else if (lower.includes("维修") || lower.includes("师傅") || lower.includes("家政") || lower.includes("保洁")) {
        replyContent = "【杨林便民师傅大厅】\n本地实名认证水电开锁、家电维修与保洁师傅，快速上门！\n点击快速找师傅：https://iyanglin.com/info";
      } else if (lower.includes("拼车") || lower.includes("出行") || lower.includes("顺风车")) {
        replyContent = "【杨林同城拼车互助】\n大学城直达昆明市区、嵩明及长水机场实时拼车动态！\n点击拼车大厅：https://iyanglin.com/info";
      } else if (lower.includes("商城") || lower.includes("服务") || lower.includes("下单")) {
        replyContent = "【杨林自营便民商城】\n平台官方担保，线上透明一口价预约下单！\n点击进店逛逛：https://iyanglin.com/services";
      } else if (lower.includes("客服") || lower.includes("电话") || lower.includes("帮助")) {
        replyContent = "【杨林生活网人工与AI客服中心】\n7×24小时全天候在线解答您的发帖与售后疑问！\n联系客服：https://iyanglin.com/contact";
      }
    }

    const replyXml = `<xml>
<ToUserName><![CDATA[${fromUser}]]></ToUserName>
<FromUserName><![CDATA[${toUser}]]></FromUserName>
<CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${replyContent}]]></Content>
</xml>`;

    return new NextResponse(replyXml, { headers: { "Content-Type": "application/xml" } });
  } catch (err) {
    console.error("[WECHAT_MP_REPLY_ERR]", err);
    return new NextResponse("success");
  }
}
