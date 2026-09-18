import { prisma } from "@/lib/prisma";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface ValidatedOrderItem {
  productId: string;
  productName: string;
  productCover?: string | null;
  specification?: string | null;
  unit: string;
  priceCents: number;
  quantity: number;
  totalCents: number;
  stock: number;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface CartCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  goodsTotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  payAmountCents: number;
  freeShippingApplied: boolean;
  freeShippingThresholdCents?: number;
  amountNeededForFreeShippingCents: number;
  deliveryMethod: "DELIVERY" | "PICKUP";
  zone?: {
    id: string;
    name: string;
    feeCents: number;
    freeShippingThresholdCents: number;
    estimatedMinutes?: string | null;
  } | null;
  items: ValidatedOrderItem[];
}

/**
 * 服务端终审商品最新价格、库存、上下架状态并计算订单金额
 * 铁律：永远重新向数据库查询，绝不信任前端传入的价格或运费！
 */
export async function calculateMallOrder(params: {
  items: CartItemInput[];
  deliveryMethod: "DELIVERY" | "PICKUP";
  zoneId?: string;
}): Promise<CartCalculationResult> {
  const { items, deliveryMethod, zoneId } = params;

  if (!items || items.length === 0) {
    return {
      isValid: false,
      errorMessage: "购物车或结算商品不能为空",
      goodsTotalCents: 0,
      deliveryFeeCents: 0,
      discountCents: 0,
      payAmountCents: 0,
      freeShippingApplied: false,
      amountNeededForFreeShippingCents: 0,
      deliveryMethod,
      items: [],
    };
  }

  // 1. 获取所有商品最新信息
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let goodsTotalCents = 0;
  let allValid = true;
  let firstError = "";
  const validatedItems: ValidatedOrderItem[] = [];

  for (const item of items) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const p = productMap.get(item.productId);

    if (!p) {
      allValid = false;
      firstError = `部分商品已失效或下架`;
      validatedItems.push({
        productId: item.productId,
        productName: "商品已下架",
        unit: "件",
        priceCents: 0,
        quantity: qty,
        totalCents: 0,
        stock: 0,
        isAvailable: false,
        unavailableReason: "商品已删除或不存在",
      });
      continue;
    }

    if (p.status !== "ON_SALE") {
      allValid = false;
      const reason = p.status === "SOLD_OUT" ? "商品已售罄" : "商品已暂售/下架";
      if (!firstError) firstError = `【${p.name}】${reason}`;
      validatedItems.push({
        productId: p.id,
        productName: p.name,
        productCover: p.coverImage,
        specification: p.specification,
        unit: p.unit,
        priceCents: p.priceCents,
        quantity: qty,
        totalCents: p.priceCents * qty,
        stock: p.stock,
        isAvailable: false,
        unavailableReason: reason,
      });
      continue;
    }

    if (p.stock < qty) {
      allValid = false;
      const reason = p.stock === 0 ? "已售罄" : `仅剩 ${p.stock} 件`;
      if (!firstError) firstError = `【${p.name}】库存不足（${reason}）`;
      validatedItems.push({
        productId: p.id,
        productName: p.name,
        productCover: p.coverImage,
        specification: p.specification,
        unit: p.unit,
        priceCents: p.priceCents,
        quantity: qty,
        totalCents: p.priceCents * qty,
        stock: p.stock,
        isAvailable: false,
        unavailableReason: reason,
      });
      continue;
    }

    // 合法在售在库商品
    const lineTotal = p.priceCents * qty;
    goodsTotalCents += lineTotal;

    validatedItems.push({
      productId: p.id,
      productName: p.name,
      productCover: p.coverImage,
      specification: p.specification,
      unit: p.unit,
      priceCents: p.priceCents,
      quantity: qty,
      totalCents: lineTotal,
      stock: p.stock,
      isAvailable: true,
    });
  }

  // 2. 计算运费
  let deliveryFeeCents = 0;
  let freeShippingApplied = false;
  let amountNeededForFreeShippingCents = 0;
  let matchedZone = null;

  if (deliveryMethod === "DELIVERY") {
    if (zoneId) {
      matchedZone = await prisma.deliveryZone.findUnique({
        where: { id: zoneId },
      });
    }

    // 若未传 zoneId，尝试取启用的第一默认区域（如大学城）
    if (!matchedZone) {
      matchedZone = await prisma.deliveryZone.findFirst({
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
      });
    }

    if (matchedZone) {
      const threshold = matchedZone.freeShippingThresholdCents;
      if (goodsTotalCents >= threshold) {
        deliveryFeeCents = 0;
        freeShippingApplied = true;
      } else {
        deliveryFeeCents = matchedZone.feeCents;
        amountNeededForFreeShippingCents = threshold - goodsTotalCents;
      }
    } else {
      // 缺省兜底运费 3元，满29包邮
      if (goodsTotalCents >= 2900) {
        deliveryFeeCents = 0;
        freeShippingApplied = true;
      } else {
        deliveryFeeCents = 300;
        amountNeededForFreeShippingCents = 2900 - goodsTotalCents;
      }
    }
  } else {
    // 到店自提 0 运费
    deliveryFeeCents = 0;
    freeShippingApplied = true;
  }

  const payAmountCents = Math.max(0, goodsTotalCents + deliveryFeeCents);

  return {
    isValid: allValid,
    errorMessage: firstError || undefined,
    goodsTotalCents,
    deliveryFeeCents,
    discountCents: 0,
    payAmountCents,
    freeShippingApplied,
    freeShippingThresholdCents: matchedZone?.freeShippingThresholdCents,
    amountNeededForFreeShippingCents,
    deliveryMethod,
    zone: matchedZone,
    items: validatedItems,
  };
}
