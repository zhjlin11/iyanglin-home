import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export type EventItem = {
  id: string;
  kind: "event";
  title: string;
  category: string;
  eventTime: string;
  location: string;
  fee: string;
  quota: string;
  contact: string;
  intro: string;
  status: string;
  createdAt: string;
  authorId?: string;
  images: string[];
  oldId?: string | null;
  signups?: Array<{
    id: string;
    name: string;
    phone: string;
    numPeople: number;
    note?: string;
    createdAt: string;
    userId?: string;
  }>;
};

const statusValue = (status: string) => status.toUpperCase() as ContentStatus;

const mapEvent = (item: any): EventItem => ({
  id: item.id,
  kind: "event",
  title: item.title,
  category: item.category || "outdoor",
  eventTime: item.eventTime,
  location: item.location,
  fee: item.fee || "免费",
  quota: item.quota || "不限",
  contact: item.contact,
  intro: item.intro,
  status: item.status.toLowerCase(),
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  authorId: item.authorId || undefined,
  images: item.images || [],
  oldId: item.oldId,
  signups: (item.signups || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    numPeople: s.numPeople || 1,
    note: s.note || undefined,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    userId: s.userId || undefined,
  })),
});

export async function getEvent(id: string): Promise<EventItem | null> {
  const item = await prisma.event.findUnique({
    where: { id },
    include: {
      signups: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) return null;
  return mapEvent(item);
}

export async function listEvents(options?: { category?: string; status?: string; authorId?: string; search?: string }) {
  const where: any = {};
  if (options?.category) where.category = options.category;
  if (options?.status) where.status = statusValue(options.status);
  if (options?.authorId) where.authorId = options.authorId;
  if (options?.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { location: { contains: options.search, mode: "insensitive" } },
      { intro: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.event.findMany({
    where,
    include: {
      signups: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map(mapEvent);
}

export async function createEvent(input: {
  title: string;
  category?: string;
  eventTime: string;
  location: string;
  fee?: string;
  quota?: string;
  contact: string;
  intro: string;
  status: string;
  authorId?: string;
  images?: string[];
  oldId?: string;
}) {
  const status = statusValue(input.status);
  const item = await prisma.event.create({
    data: {
      title: input.title,
      category: input.category || "outdoor",
      eventTime: input.eventTime,
      location: input.location,
      fee: input.fee || "免费",
      quota: input.quota || "不限",
      contact: input.contact,
      intro: input.intro,
      status,
      authorId: input.authorId,
      images: input.images || [],
      oldId: input.oldId,
    },
  });

  await prisma.operationLog.create({
    data: {
      userId: input.authorId,
      action: `CREATE_EVENT_${status}`,
      targetId: item.id,
      metadata: { title: item.title, category: item.category },
    },
  });

  return mapEvent(item);
}

export async function createEventSignup(input: { eventId: string; name: string; phone: string; numPeople?: number; note?: string; authorId?: string }) {
  const signup = await prisma.eventSignup.create({
    data: {
      eventId: input.eventId,
      name: input.name,
      phone: input.phone,
      numPeople: input.numPeople || 1,
      note: input.note,
      userId: input.authorId,
    },
  });

  return {
    id: signup.id,
    name: signup.name,
    phone: signup.phone,
    numPeople: signup.numPeople,
    note: signup.note || undefined,
    createdAt: signup.createdAt.toISOString(),
    userId: signup.userId || undefined,
  };
}

export async function updateEvent(
  id: string,
  status: string,
  fields?: {
    title?: string;
    category?: string;
    eventTime?: string;
    location?: string;
    fee?: string;
    quota?: string;
    contact?: string;
    intro?: string;
    images?: string[];
  },
) {
  const value = statusValue(status);
  const updated = await prisma.event.update({
    where: { id },
    data: {
      status: value,
      ...(fields?.title !== undefined ? { title: fields.title } : {}),
      ...(fields?.category !== undefined ? { category: fields.category } : {}),
      ...(fields?.eventTime !== undefined ? { eventTime: fields.eventTime } : {}),
      ...(fields?.location !== undefined ? { location: fields.location } : {}),
      ...(fields?.fee !== undefined ? { fee: fields.fee } : {}),
      ...(fields?.quota !== undefined ? { quota: fields.quota } : {}),
      ...(fields?.contact !== undefined ? { contact: fields.contact } : {}),
      ...(fields?.intro !== undefined ? { intro: fields.intro } : {}),
      ...(fields?.images !== undefined ? { images: fields.images } : {}),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: `UPDATE_EVENT_${value}`,
      targetId: updated.id,
      metadata: { title: updated.title },
    },
  });

  return mapEvent(updated);
}
