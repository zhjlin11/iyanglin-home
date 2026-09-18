import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export type HouseItem = {
  id: string;
  kind: "house";
  title: string;
  houseType: string;
  price: string;
  layout: string;
  areaSize: string;
  location: string;
  contact: string;
  body: string;
  status: string;
  createdAt: string;
  authorId?: string;
  images: string[];
  oldId?: string | null;
};

const statusValue = (status: string) => status.toUpperCase() as ContentStatus;

const mapHouse = (item: any): HouseItem => ({
  id: item.id,
  kind: "house",
  title: item.title,
  houseType: item.houseType || "rent",
  price: item.price || "面议",
  layout: item.layout || "不限",
  areaSize: item.areaSize || "不限",
  location: item.location || "杨林地区",
  contact: item.contact || "",
  body: item.body,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt.toISOString(),
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
});

export async function getHouse(id: string): Promise<HouseItem | null> {
  const item = await prisma.house.findUnique({ where: { id } });
  return item ? mapHouse(item) : null;
}

export async function listHouses(options?: { houseType?: string; status?: string; authorId?: string; search?: string }) {
  const status = options?.status ? statusValue(options.status) : "APPROVED";

  const baseWhere: any = { status };
  if (options?.houseType) baseWhere.houseType = options.houseType;
  if (options?.authorId) baseWhere.authorId = options.authorId;
  if (options?.search) {
    baseWhere.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { location: { contains: options.search, mode: "insensitive" } },
      { body: { contains: options.search, mode: "insensitive" } },
    ];
  }

  // Query 1: Fetch houses WITH images first (take up to 60 items)
  const housesWithPhoto = await prisma.house.findMany({
    where: {
      ...baseWhere,
      images: { isEmpty: false }
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // Query 2: Fetch remaining houses without images to fill up if needed
  const excludeIds = housesWithPhoto.map(h => h.id);
  const remainingCount = Math.max(0, 60 - housesWithPhoto.length);

  let housesNoPhoto: any[] = [];
  if (remainingCount > 0) {
    housesNoPhoto = await prisma.house.findMany({
      where: {
        ...baseWhere,
        id: { notIn: excludeIds }
      },
      orderBy: { createdAt: "desc" },
      take: remainingCount,
    });
  }

  return [...housesWithPhoto.map(mapHouse), ...housesNoPhoto.map(mapHouse)];
}

export async function createHouse(input: {
  title: string;
  houseType?: string;
  price?: string;
  layout?: string;
  areaSize?: string;
  location?: string;
  contact: string;
  body: string;
  status: string;
  authorId?: string;
  images?: string[];
  oldId?: string;
}) {
  const status = statusValue(input.status);
  const item = await prisma.house.create({
    data: {
      title: input.title,
      houseType: input.houseType || "rent",
      price: input.price || "面议",
      layout: input.layout || "不限",
      areaSize: input.areaSize || "不限",
      location: input.location || "杨林地区",
      contact: input.contact,
      body: input.body,
      status,
      authorId: input.authorId,
      images: input.images || [],
      oldId: input.oldId,
    },
  });

  await prisma.operationLog.create({
    data: {
      userId: input.authorId,
      action: `CREATE_HOUSE_${status}`,
      targetId: item.id,
      metadata: { title: item.title, houseType: item.houseType },
    },
  });

  return mapHouse(item);
}

export async function updateHouse(
  id: string,
  status: string,
  fields?: {
    title?: string;
    houseType?: string;
    price?: string;
    layout?: string;
    areaSize?: string;
    location?: string;
    contact?: string;
    body?: string;
    images?: string[];
  },
) {
  const value = statusValue(status);
  const updated = await prisma.house.update({
    where: { id },
    data: {
      status: value,
      ...(fields?.title !== undefined ? { title: fields.title } : {}),
      ...(fields?.houseType !== undefined ? { houseType: fields.houseType } : {}),
      ...(fields?.price !== undefined ? { price: fields.price } : {}),
      ...(fields?.layout !== undefined ? { layout: fields.layout } : {}),
      ...(fields?.areaSize !== undefined ? { areaSize: fields.areaSize } : {}),
      ...(fields?.location !== undefined ? { location: fields.location } : {}),
      ...(fields?.contact !== undefined ? { contact: fields.contact } : {}),
      ...(fields?.body !== undefined ? { body: fields.body } : {}),
      ...(fields?.images !== undefined ? { images: fields.images } : {}),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: `UPDATE_HOUSE_${value}`,
      targetId: updated.id,
      metadata: { title: updated.title },
    },
  });

  return mapHouse(updated);
}
