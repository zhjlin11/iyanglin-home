import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export type DatingProfileItem = {
  id: string;
  kind: "love";
  gender: string; // female | male
  nickname: string;
  birthYear: number;
  heightCm: number;
  education: string;
  occupation: string;
  income: string;
  maritalStatus: string;
  location: string;
  requirement: string;
  intro: string;
  contact: string;
  status: string;
  viewsCount: number;
  createdAt: string;
  authorId?: string;
  photos: string[];
  oldId?: string | null;
};

const statusValue = (status: string) => status.toUpperCase() as ContentStatus;

const mapMaritalStatusText = (val: any): string => {
  if (val === "0" || val === 0) return "未婚";
  if (val === "1" || val === 1) return "离异";
  if (val === "2" || val === 2) return "丧偶";
  if (val === "3" || val === 3) return "未婚";
  return val ? String(val) : "未婚";
};

const mapOccupationText = (val: any): string => {
  if (val === "0" || val === 0) return "高校/教育";
  if (val === "1" || val === 1) return "经开区企业";
  if (val === "2" || val === 2) return "医疗/卫健";
  if (val === "3" || val === 3) return "IT/互联网";
  if (val === "4" || val === 4) return "金融/财会";
  if (val === "5" || val === 5) return "个体/创业";
  if (val === "6" || val === 6) return "自由职业";
  return val ? String(val) : "杨林本地";
};

const mapDatingProfile = (item: any): DatingProfileItem => ({
  id: item.id,
  kind: "love",
  gender: item.gender || "female",
  nickname: item.nickname,
  birthYear: item.birthYear || 1995,
  heightCm: item.heightCm || 165,
  education: item.education || "本科",
  occupation: mapOccupationText(item.occupation),
  income: item.income || "5000-8000元/月",
  maritalStatus: mapMaritalStatusText(item.maritalStatus),
  location: item.location || "杨林本地",
  requirement: item.requirement,
  intro: item.intro,
  contact: item.contact,
  status: item.status.toLowerCase(),
  viewsCount: item.viewsCount || 0,
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  authorId: item.authorId || undefined,
  photos: item.photos || [],
  oldId: item.oldId,
});

export async function getDatingProfile(id: string): Promise<DatingProfileItem | null> {
  const item = await prisma.datingProfile.findUnique({
    where: { id },
  });

  if (!item) return null;

  // Async view count increment
  await prisma.datingProfile.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  return mapDatingProfile(item);
}

export async function listDatingProfiles(options?: { gender?: string; status?: string; authorId?: string; search?: string }) {
  const status = options?.status && options.status !== "ALL" ? statusValue(options.status) : undefined;

  const baseWhere: any = status ? { status } : {};
  if (options?.gender) baseWhere.gender = options.gender;
  if (options?.authorId) baseWhere.authorId = options.authorId;
  if (options?.search) {
    baseWhere.OR = [
      { nickname: { contains: options.search, mode: "insensitive" } },
      { occupation: { contains: options.search, mode: "insensitive" } },
      { intro: { contains: options.search, mode: "insensitive" } },
    ];
  }

  // Fetch all matching items sorted by createdAt desc
  const allItems = await prisma.datingProfile.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
  });

  // Perform in-memory sorting: Items WITH photos come FIRST!
  const withPhotos = allItems.filter(item => item.photos && item.photos.length > 0);
  const noPhotos = allItems.filter(item => !item.photos || item.photos.length === 0);

  return [...withPhotos.map(mapDatingProfile), ...noPhotos.map(mapDatingProfile)];
}

export async function createDatingProfile(input: {
  gender?: string;
  nickname: string;
  birthYear?: number;
  heightCm?: number;
  education?: string;
  occupation: string;
  income?: string;
  maritalStatus?: string;
  location?: string;
  requirement: string;
  intro: string;
  contact: string;
  status: string;
  authorId?: string;
  photos?: string[];
  oldId?: string;
}) {
  const status = statusValue(input.status);
  const item = await prisma.datingProfile.create({
    data: {
      gender: input.gender || "female",
      nickname: input.nickname,
      birthYear: input.birthYear || 1995,
      heightCm: input.heightCm || 165,
      education: input.education || "本科",
      occupation: input.occupation,
      income: input.income || "5000-8000元/月",
      maritalStatus: input.maritalStatus || "未婚",
      location: input.location || "杨林本地",
      requirement: input.requirement,
      intro: input.intro,
      contact: input.contact,
      status,
      authorId: input.authorId,
      photos: input.photos || [],
      oldId: input.oldId,
    },
  });

  await prisma.operationLog.create({
    data: {
      userId: input.authorId,
      action: `CREATE_DATING_PROFILE_${status}`,
      targetId: item.id,
      metadata: { nickname: item.nickname, gender: item.gender },
    },
  });

  return mapDatingProfile(item);
}

export async function updateDatingProfile(
  id: string,
  status: string,
  fields?: {
    gender?: string;
    nickname?: string;
    birthYear?: number;
    heightCm?: number;
    education?: string;
    occupation?: string;
    income?: string;
    maritalStatus?: string;
    location?: string;
    requirement?: string;
    intro?: string;
    contact?: string;
    photos?: string[];
  },
) {
  const value = statusValue(status);
  const updated = await prisma.datingProfile.update({
    where: { id },
    data: {
      status: value,
      ...(fields?.gender !== undefined ? { gender: fields.gender } : {}),
      ...(fields?.nickname !== undefined ? { nickname: fields.nickname } : {}),
      ...(fields?.birthYear !== undefined ? { birthYear: fields.birthYear } : {}),
      ...(fields?.heightCm !== undefined ? { heightCm: fields.heightCm } : {}),
      ...(fields?.education !== undefined ? { education: fields.education } : {}),
      ...(fields?.occupation !== undefined ? { occupation: fields.occupation } : {}),
      ...(fields?.income !== undefined ? { income: fields.income } : {}),
      ...(fields?.maritalStatus !== undefined ? { maritalStatus: fields.maritalStatus } : {}),
      ...(fields?.location !== undefined ? { location: fields.location } : {}),
      ...(fields?.requirement !== undefined ? { requirement: fields.requirement } : {}),
      ...(fields?.intro !== undefined ? { intro: fields.intro } : {}),
      ...(fields?.contact !== undefined ? { contact: fields.contact } : {}),
      ...(fields?.photos !== undefined ? { photos: fields.photos } : {}),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: `UPDATE_DATING_PROFILE_${value}`,
      targetId: updated.id,
      metadata: { nickname: updated.nickname },
    },
  });

  return mapDatingProfile(updated);
}
