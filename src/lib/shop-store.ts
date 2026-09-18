import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export type ShopItem = {
  id: string;
  kind: "shop";
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  intro: string;
  logo?: string | null;
  images: string[];
  status: string;
  isFeatured: boolean;
  isTop: boolean;
  createdAt: string;
  authorId?: string;
  oldId?: string | null;
};

const statusValue = (status: string) => status.toUpperCase() as ContentStatus;

const mapShop = (item: any): ShopItem => ({
  id: item.id,
  kind: "shop",
  name: item.name,
  category: item.category || "food",
  address: item.address || "杨林地区",
  phone: item.phone || "",
  hours: item.hours || "09:00 - 21:00",
  intro: item.intro,
  logo: item.logo,
  images: item.images || [],
  status: item.status.toLowerCase(),
  isFeatured: item.isFeatured || false,
  isTop: item.isTop || false,
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  authorId: item.authorId || undefined,
  oldId: item.oldId,
});

export async function getShop(id: string): Promise<ShopItem | null> {
  const item = await prisma.shop.findUnique({ where: { id } });
  return item ? mapShop(item) : null;
}

export async function listShops(options?: { category?: string; status?: string; authorId?: string; search?: string }) {
  const status = options?.status ? statusValue(options.status) : "APPROVED";
  
  const baseWhere: any = { status };
  if (options?.category) baseWhere.category = options.category;
  if (options?.authorId) baseWhere.authorId = options.authorId;
  if (options?.search) {
    baseWhere.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { address: { contains: options.search, mode: "insensitive" } },
      { intro: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const shops = await prisma.shop.findMany({
    where: baseWhere,
    orderBy: [{ isTop: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  return shops.map(mapShop);
}

export async function createShop(input: {
  name: string;
  category?: string;
  address?: string;
  phone: string;
  hours?: string;
  intro: string;
  logo?: string;
  images?: string[];
  status: string;
  authorId?: string;
  oldId?: string;
}) {
  const status = statusValue(input.status);
  const item = await prisma.shop.create({
    data: {
      name: input.name,
      category: input.category || "food",
      address: input.address || "杨林地区",
      phone: input.phone,
      hours: input.hours || "09:00 - 21:00",
      intro: input.intro,
      logo: input.logo || null,
      images: input.images || [],
      status,
      authorId: input.authorId,
      oldId: input.oldId,
    },
  });

  await prisma.operationLog.create({
    data: {
      userId: input.authorId,
      action: `CREATE_SHOP_${status}`,
      targetId: item.id,
      metadata: { name: item.name, category: item.category },
    },
  });

  return mapShop(item);
}

export async function updateShop(
  id: string,
  status: string,
  fields?: {
    name?: string;
    category?: string;
    address?: string;
    phone?: string;
    hours?: string;
    intro?: string;
    logo?: string;
    images?: string[];
    isFeatured?: boolean;
  },
) {
  const value = statusValue(status);
  const updated = await prisma.shop.update({
    where: { id },
    data: {
      status: value,
      ...(fields?.name !== undefined ? { name: fields.name } : {}),
      ...(fields?.category !== undefined ? { category: fields.category } : {}),
      ...(fields?.address !== undefined ? { address: fields.address } : {}),
      ...(fields?.phone !== undefined ? { phone: fields.phone } : {}),
      ...(fields?.hours !== undefined ? { hours: fields.hours } : {}),
      ...(fields?.intro !== undefined ? { intro: fields.intro } : {}),
      ...(fields?.logo !== undefined ? { logo: fields.logo } : {}),
      ...(fields?.images !== undefined ? { images: fields.images } : {}),
      ...(fields?.isFeatured !== undefined ? { isFeatured: fields.isFeatured } : {}),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: `UPDATE_SHOP_${value}`,
      targetId: updated.id,
      metadata: { name: updated.name },
    },
  });

  return mapShop(updated);
}

export async function deleteShop(id: string) {
  const deleted = await prisma.shop.delete({ where: { id } });
  await prisma.operationLog.create({
    data: {
      action: "DELETE_SHOP",
      targetId: id,
      metadata: { name: deleted.name },
    },
  });
  return true;
}
