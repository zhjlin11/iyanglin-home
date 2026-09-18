import { prisma } from "@/lib/prisma";
import { getPayConfig, nonceStr, signMD5, toXml, parseXml } from "@/lib/wechat-pay";
import fs from "fs";
import https from "https";

export interface ExecuteRefundParams {
  orderId: string;
  amountCents: number;
  reason: string;
  operatorId?: string;
}

export function callWechatSecApi(
  url: string,
  xmlData: string,
  certPath: string,
  keyPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const cert = fs.readFileSync(certPath);
      const key = fs.readFileSync(keyPath);

      const req = https.request(
        {
          hostname: parsedUrl.hostname,
          port: 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method: "POST",
          cert: cert,
          key: key,
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Content-Length": Buffer.byteLength(xmlData, "utf8"),
          },
          timeout: 15000,
        },
        (res) => {
          let responseBody = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            resolve(responseBody);
          });
        }
      );

      req.on("error", (err) => {
        reject(err);
      });

      req.on("timeout", () => {
        req.destroy(new Error("微信退款安全接口请求超时 (15s)"));
      });

      req.write(xmlData, "utf8");
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function executeOrderRefund(params: ExecuteRefundParams) {
  const { orderId, amountCents, reason, operatorId } = params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { provider: true, user: true },
  });

  if (!order) throw new Error("订单不存在");

  // 校验退款状态，防止并发重复退款
  if (order.status === "REFUNDED" || order.paymentStatus === "REFUNDED") {
    throw new Error("该订单已全额退款，不可重复退款");
  }

  if (order.refundStatus === "PROCESSING") {
    throw new Error("退款正在处理中，请勿重复提交");
  }

  // 校验退款金额不能超过实付金额
  if (amountCents <= 0 || amountCents > order.payAmountCents) {
    throw new Error(`退款金额不合法: 最多可退 ¥${(order.payAmountCents / 100).toFixed(2)}`);
  }

  const refundNo = "RFD" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

  // 创建退款记录，初始状态为 PROCESSING
  const refundRecord = await prisma.refund.create({
    data: {
      refundNo,
      orderId: order.id,
      userId: order.userId,
      amountCents,
      reason,
      status: "PROCESSING",
      processedBy: operatorId || null,
    },
  });

  // 更新订单状态锁定
  await prisma.serviceOrder.update({
    where: { id: order.id },
    data: {
      refundStatus: "PROCESSING",
      status: "REFUNDING",
    },
  });

  let wechatRefundId = "";
  let refundSuccess = false;

  try {
    const config = getPayConfig();
    const certPath = process.env.WECHAT_PAY_CERT_PATH;
    const keyPath = process.env.WECHAT_PAY_KEY_PATH;

    if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const reqParams: Record<string, string> = {
        appid: config.appId,
        mch_id: config.mchId,
        nonce_str: nonceStr(),
        out_trade_no: order.orderNo,
        out_refund_no: refundNo,
        total_fee: String(order.payAmountCents),
        refund_fee: String(amountCents),
      };
      reqParams.sign = signMD5(reqParams, config.apiKey);

      const resText = await callWechatSecApi(
        "https://api.mch.weixin.qq.com/secapi/pay/refund",
        toXml(reqParams),
        certPath,
        keyPath
      );
      const parsed = parseXml(resText);

      if (parsed.return_code === "SUCCESS" && parsed.result_code === "SUCCESS") {
        wechatRefundId = parsed.refund_id || refundNo;
        refundSuccess = true;
      } else {
        throw new Error(parsed.err_code_des || parsed.return_msg || "微信退款接口返回失败");
      }
    } else {
      // 未配置商户证书时的受控退款记录 (测试/人工对账兜底)
      wechatRefundId = "REC_RFD_" + Date.now();
      refundSuccess = true;
    }
  } catch (err: any) {
    // 退款失败回滚
    await prisma.refund.update({
      where: { id: refundRecord.id },
      data: {
        status: "FAILED",
        rejectReason: err.message,
      },
    });

    await prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        refundStatus: "REJECTED",
        status: order.status === "REFUNDING" ? "PAID" : order.status,
      },
    });

    throw err;
  }

  if (refundSuccess) {
    // 退款成功：更新退款单与订单
    await prisma.refund.update({
      where: { id: refundRecord.id },
      data: {
        status: "SUCCESS",
        wechatRefundId,
        wechatRefundFee: amountCents,
        processedAt: new Date(),
      },
    });

    await prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
        refundStatus: "REFUNDED",
        cancelledAt: new Date(),
        cancelReason: `用户/平台退款: ${reason}`,
      },
    });

    // 作废结算单并从服务商在途资金中扣除
    await prisma.settlement.updateMany({
      where: { orderId: order.id },
      data: {
        status: "CANCELLED",
        remark: `订单已全额退款作废 (退款单号: ${refundNo})`,
      },
    });

    await prisma.serviceProvider.update({
      where: { id: order.providerId },
      data: {
        pendingBalance: { decrement: order.providerIncomeCents },
      },
    }).catch(() => null);

    // 若使用了优惠券且全额退款，触发优惠券回退保护 (P4)
    if (order.userCouponId && amountCents >= order.payAmountCents) {
      const { rollbackUserCoupon } = await import("@/lib/coupon-engine");
      await rollbackUserCoupon(order.userCouponId, order.id).catch((e) =>
        console.error("Failed to rollback user coupon during refund:", e)
      );
    }

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        action: "SERVICE_ORDER_REFUNDED",
        targetId: order.id,
        metadata: {
          refundNo,
          wechatRefundId,
          amountCents,
          reason,
          operatorId,
        },
      },
    });

    // 通知用户退款成功
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "SYSTEM_NOTICE",
        title: "服务订单退款成功",
        content: `您的订单【${order.productTitle}】已成功退款 ¥${(amountCents / 100).toFixed(2)}，资金将原路返回至您的支付账户。`,
        link: `/orders/${order.id}`,
      },
    });

    // 通知服务商订单已退款
    if (order.provider.userId) {
      await prisma.notification.create({
        data: {
          userId: order.provider.userId,
          type: "SYSTEM_NOTICE",
          title: "客户订单已退款取消",
          content: `订单【${order.productTitle}】已全额退款取消，在途履约冻结资金已解除。`,
          link: `/provider/center?tab=orders`,
        },
      });
    }

    return { success: true, refundNo, wechatRefundId };
  }
}

/**
 * 执行 BillingOrder (金币充值、便民/房产/招聘置顶、好店、会员等) 原路退款与权益冲正
 */
export async function executeBillingOrderRefund(params: {
  orderId: string;
  reason: string;
  operatorId?: string;
  operatorUsername?: string;
}) {
  const { orderId, reason, operatorId, operatorUsername } = params;

  const order = await prisma.billingOrder.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) throw new Error("订单不存在");
  if (order.status === "REFUNDED") {
    throw new Error("该订单已全额退款，不可重复退款");
  }
  if (order.status !== "PAID") {
    throw new Error("只有已支付的订单才可发起退款");
  }

  // 1. 获取支付日志与微信交易号
  const payLog = await prisma.operationLog.findFirst({
    where: {
      action: "WECHAT_PAY_SUCCESS",
      targetId: order.id,
    },
    orderBy: { createdAt: "desc" },
  });
  const transactionId = (payLog?.metadata as any)?.transactionId || "";

  const refundNo =
    "RFD" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  let wechatRefundId = "";
  let automatedWechatRefund = false;
  let wechatRefundError = "";

  // 2. 尝试调用微信商户接口进行原路退款（若已配置双向证书）
  const certPath = process.env.WECHAT_PAY_CERT_PATH;
  const keyPath = process.env.WECHAT_PAY_KEY_PATH;

  if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
      const config = getPayConfig();
      const reqParams: Record<string, string> = {
        appid: config.appId,
        mch_id: config.mchId,
        nonce_str: nonceStr(),
        out_trade_no: order.orderNo,
        out_refund_no: refundNo,
        total_fee: String(order.amountCents),
        refund_fee: String(order.amountCents),
      };
      if (transactionId) {
        reqParams.transaction_id = transactionId;
      }
      reqParams.sign = signMD5(reqParams, config.apiKey);

      const resText = await callWechatSecApi(
        "https://api.mch.weixin.qq.com/secapi/pay/refund",
        toXml(reqParams),
        certPath,
        keyPath
      );
      const parsed = parseXml(resText);

      if (parsed.return_code === "SUCCESS" && parsed.result_code === "SUCCESS") {
        wechatRefundId = parsed.refund_id || refundNo;
        automatedWechatRefund = true;
      } else {
        wechatRefundError = parsed.err_code_des || parsed.return_msg || "微信退款接口返回失败";
        console.warn("[WeChat Pay Refund API Warning]:", wechatRefundError);
      }
    } catch (e: any) {
      wechatRefundError = e.message;
      console.warn("[WeChat Pay Refund Network/Cert Warning]:", e.message);
    }
  }

  if (!wechatRefundId) {
    wechatRefundId = "REC_RFD_" + Date.now();
  }

  // 3. 业务权益安全冲正回收 (防止退款后白嫖金币或置顶)
  const targetKind = (order.targetKind || "").toLowerCase();
  const targetId = order.targetId;

  if (targetKind === "coin") {
    // 回收充值金币
    const { COIN_RECHARGE_PACKAGES, refundCoins } = await import("@/lib/coin-wallet-store");
    const pkg = COIN_RECHARGE_PACKAGES.find((p) => p.priceCents === order.amountCents) || {
      coins: Math.floor(order.amountCents / 10),
      bonusCoins: 0,
    };
    const totalCoins = pkg.coins + (pkg.bonusCoins || 0);
    await refundCoins(
      targetId,
      totalCoins,
      order.orderNo,
      `订单退款冲正扣减金币: ${order.orderNo}`
    ).catch((e) => {
      console.warn("回收金币异常:", e.message);
    });
  } else if (
    ["house", "listing", "job", "shop", "event", "post", "love", "dating_photo"].includes(
      targetKind
    )
  ) {
    // 取消置顶
    const modelMap: Record<string, string> = {
      shop: "shop",
      house: "house",
      listing: "listing",
      job: "job",
      post: "post",
      event: "event",
      article: "article",
      love: "datingProfile",
      dating_photo: "datingProfile",
    };
    const modelName = modelMap[targetKind];
    if (modelName && (prisma as any)[modelName]) {
      await (prisma as any)[modelName]
        .update({
          where: { id: targetId },
          data: { isTop: false, topUntil: null },
        })
        .catch(() => {});
    }
  } else if (targetKind === "membership") {
    await prisma.userMembership
      .updateMany({
        where: { userId: targetId, status: "ACTIVE" },
        data: { status: "EXPIRED" },
      })
      .catch(() => {});
  } else if (targetKind === "mall_order") {
    // 自营便利店订单退款联动处理
    const mallOrder = await prisma.mallOrder.findFirst({
      where: {
        OR: [
          { orderNo: order.orderNo },
          { id: targetId },
        ],
      },
      include: { items: true },
    });

    if (mallOrder) {
      await prisma.$transaction(async (tx) => {
        // 1. 更新 MallOrder 状态为 REFUNDED
        await tx.mallOrder.update({
          where: { id: mallOrder.id },
          data: {
            status: "REFUNDED",
            cancelReason: `管理员后台微信原路全额退款 ¥${(order.amountCents / 100).toFixed(2)}${
              wechatRefundId ? ` (微信退款单号: ${wechatRefundId})` : ""
            }`,
          },
        });

        // 2. 回滚商品库存与销量
        for (const item of mallOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              salesCount: { decrement: item.quantity },
            },
          }).catch((e) => {
            console.warn("回滚商城商品库存异常:", e.message);
          });
        }

        // 3. 记录商城订单专属日志
        await tx.mallOrderLog.create({
          data: {
            orderId: mallOrder.id,
            operator: "ADMIN",
            operatorName: operatorUsername || "系统管理员",
            action: "REFUND",
            notes: `管理员后台办理全额退款 ¥${(order.amountCents / 100).toFixed(2)}${
              wechatRefundId ? `，微信退款单号: ${wechatRefundId}` : ""
            }，商户退款单号: ${refundNo}`,
            metadata: {
              refundNo,
              wechatRefundId,
              amountCents: order.amountCents,
              transactionId,
              reason: reason || "管理后台原路退款",
            },
          },
        }).catch((e) => {
          console.warn("记录商城退款日志异常:", e.message);
        });
      });
    }
  }

  // 4. 更新订单状态为 REFUNDED
  const updatedOrder = await prisma.billingOrder.update({
    where: { id: order.id },
    data: { status: "REFUNDED" },
  });

  // 5. 记录退款审计日志
  await prisma.operationLog.create({
    data: {
      userId: operatorId || null,
      action: "ADMIN_REFUND_ORDER",
      targetId: order.id,
      metadata: {
        orderNo: order.orderNo,
        transactionId,
        refundNo,
        wechatRefundId,
        automatedWechatRefund,
        wechatRefundError: wechatRefundError || null,
        amountCents: order.amountCents,
        reason,
        operator: operatorUsername || "管理员",
        rightsRevoked: true,
      },
    },
  });

  // 6. 若订单有关联用户，发送系统退款通知
  if (order.userId) {
    const isMall = targetKind === "mall_order";
    await prisma.notification
      .create({
        data: {
          userId: order.userId,
          type: "SYSTEM_NOTICE",
          title: isMall ? "便利店订单退款到账通知" : "订单退款到账通知",
          content: isMall
            ? `您的自营便利店订单【${order.targetTitle || order.orderNo}】已由管理员在后台办理全额退款 ¥${(
                order.amountCents / 100
              ).toFixed(2)}。退款资金已原路退回您的微信账户（零钱或付款卡），商品库存已释放。`
            : `您的订单【${order.targetTitle || order.planName}】已由管理员操作退款 ¥${(
                order.amountCents / 100
              ).toFixed(2)}。退款单号：${refundNo}，对应权益已冲正回收。`,
          link: isMall ? `/mall/orders/${targetId || ""}` : `/orders`,
        },
      })
      .catch(() => {});
  }

  return {
    success: true,
    refundNo,
    wechatRefundId,
    automatedWechatRefund,
    wechatRefundError,
    transactionId,
    order: updatedOrder,
  };
}

