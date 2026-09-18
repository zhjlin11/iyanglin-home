import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseXml, toXml, verifyNotifySign } from "@/lib/wechat-pay";
import { COIN_RECHARGE_PACKAGES, rechargeCoins } from "@/lib/coin-wallet-store";
import { grantMembership } from "@/lib/membership-store";
import { activateListingPromotion } from "@/lib/info-promotions";

/**
 * POST /api/payment/wechat/notify — 微信支付结果异步回调
 *
 * 微信服务器会在用户支付成功后向此地址发送 XML 通知。
 * 必须在 5 秒内返回 SUCCESS，否则微信会重试。
 */
export async function POST(request: Request) {
  const SUCCESS_XML = toXml({ return_code: "SUCCESS", return_msg: "OK" });
  const FAIL_XML = toXml({ return_code: "FAIL", return_msg: "签名验证失败" });

  try {
    const xmlBody = await request.text();
    const parsed = parseXml(xmlBody);

    // 基础校验
    if (parsed.return_code !== "SUCCESS" || parsed.result_code !== "SUCCESS") {
      console.warn("[微信支付回调] 交易未成功:", parsed.return_msg || parsed.err_code_des);
      return new Response(SUCCESS_XML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // 验证签名
    const apiKey = process.env.WECHAT_PAY_API_KEY || "";
    if (!verifyNotifySign(parsed, apiKey)) {
      console.error("[微信支付回调] 签名验证失败");
      return new Response(FAIL_XML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const orderNo = parsed.out_trade_no;
    const transactionId = parsed.transaction_id;
    const totalFee = parseInt(parsed.total_fee, 10);

    // 查找本站订单
    const order = await prisma.billingOrder.findUnique({
      where: { orderNo },
    });

    if (!order) {
      console.warn("[微信支付回调] 订单不存在:", orderNo);
      return new Response(SUCCESS_XML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // 防重复处理
    if (order.status === "PAID") {
      return new Response(SUCCESS_XML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // 金额校验
    if (totalFee !== order.amountCents) {
      console.error(
        `[微信支付回调] 金额不匹配: 订单 ${order.amountCents} 分, 回调 ${totalFee} 分`
      );
      return new Response(FAIL_XML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // 确认支付 → 更新订单状态 + 激活置顶
    const plan = order.planId
      ? await prisma.billingPlan.findUnique({ where: { id: order.planId } })
      : null;
    const durationDays = plan ? plan.durationDays : 7;
    const topUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await prisma.billingOrder.update({
      where: { orderNo },
      data: { status: "PAID", paidAt: new Date() },
    });

    // 处理防篡改报价单生成的发布/增值权益
    if (order.quoteId) {
      const quote = await prisma.billingQuote.findUnique({
        where: { id: order.quoteId },
      });
      if (quote) {
        await prisma.billingQuote.update({
          where: { id: quote.id },
          data: { status: "PAID" },
        });

        const entitlement = await prisma.billingEntitlement.create({
          data: {
            userId: quote.userId,
            companyId: quote.companyId,
            module: quote.module,
            action: quote.action,
            assetType: "RMB",
            sourceOrderId: order.id,
            quoteId: quote.id,
            status: "AVAILABLE",
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          },
        });

        await prisma.billingOrder.update({
          where: { id: order.id },
          data: { entitlementId: entitlement.id },
        });
      }
    }

    // 激活对应模块的置顶或充值
    const { targetKind, targetId } = order;

    if (targetKind === "coin") {
      const pkg = COIN_RECHARGE_PACKAGES.find((p) => p.priceCents === totalFee) || {
        coins: Math.floor(totalFee / 10),
        bonusCoins: 0,
      };
      const totalCoins = pkg.coins + (pkg.bonusCoins || 0);
      await rechargeCoins(
        targetId,
        totalCoins,
        orderNo,
        `微信在线充值: ${order.targetTitle || "金币套餐"}`
      ).catch((e: Error) => {
        console.warn(`[微信支付回调] 充值金币入账失败:`, e.message);
      });
    } else if (targetKind === "membership") {
      await grantMembership(targetId, order.planId || order.targetTitle).catch(
        (e: Error) => {
          console.warn(`[微信支付回调] 开通会员入账失败:`, e.message);
        }
      );
    } else if (targetKind === "listing_promotion") {
      await activateListingPromotion(orderNo, "PAID").catch((e: Error) => {
        console.warn(`[微信支付回调] 激活便民推广失败:`, e.message);
      });
    } else if (targetKind === "service_order") {
      const { onOrderPaymentSuccess } = await import("@/lib/service-order-machine");
      await onOrderPaymentSuccess(orderNo, transactionId).catch((e: Error) => {
        console.warn(`[微信支付回调] 服务订单入账失败:`, e.message);
      });
    } else if (targetKind === "mall_order") {
      const { onMallOrderPaymentSuccess } = await import("@/lib/mall/mall-order-machine");
      await onMallOrderPaymentSuccess(orderNo, transactionId).catch((e: Error) => {
        console.warn(`[微信支付回调] 自营商城订单入账失败:`, e.message);
      });
    } else {
      const modelMap: Record<string, string> = {
        shop: "shop",
        house: "house",
        listing: "listing",
        job: "job",
        post: "post",
        event: "event",
        article: "article",
        love: "datingProfile",
      };

      const modelName = modelMap[targetKind];
      if (modelName && (prisma as Record<string, any>)[modelName]) {
        await (prisma as Record<string, any>)[modelName]
          .update({
            where: { id: targetId },
            data: { isTop: true, topUntil },
          })
          .catch((e: Error) => {
            console.warn(`[微信支付回调] 激活置顶失败 (${targetKind}/${targetId}):`, e.message);
          });
      }
    }

    // 操作日志
    await prisma.operationLog.create({
      data: {
        action: "WECHAT_PAY_SUCCESS",
        targetId: order.id,
        metadata: {
          orderNo,
          transactionId,
          amountCents: totalFee,
          targetKind,
          targetId,
          topUntil: topUntil.toISOString(),
        },
      },
    });

    console.log(`[微信支付回调] 订单 ${orderNo} 支付成功, 微信交易号: ${transactionId}`);

    return new Response(SUCCESS_XML, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (err) {
    console.error("[微信支付回调] 处理异常:", err);
    return new Response(
      toXml({ return_code: "FAIL", return_msg: "服务器内部错误" }),
      {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      }
    );
  }
}
