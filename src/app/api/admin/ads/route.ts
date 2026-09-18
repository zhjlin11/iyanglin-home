import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [placements, ads] = await Promise.all([
    prisma.adPlacement.findMany({ include: { ads: true } }),
    prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({ placements, ads });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { placementId, title, image, link, sort } = body;

  if (!placementId || !title || !image || !link) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ad = await prisma.advertisement.create({
    data: {
      placementId,
      title,
      image,
      link,
      sort: sort || 0,
      createdBy: session.username,
    },
  });

  await prisma.operationLog.create({
    data: {
      userId: session.id,
      action: "create_advertisement",
      targetId: ad.id,
      metadata: { title },
    },
  });

  return NextResponse.json({ ad });
}
