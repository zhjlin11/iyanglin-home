import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createEventSignup } from "@/lib/event-store";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录后再报名活动" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !body.eventId || !body.name || !body.phone) {
    return NextResponse.json({ error: "姓名和联系电话不能为空" }, { status: 400 });
  }

  const signup = await createEventSignup({
    eventId: String(body.eventId),
    name: String(body.name).trim(),
    phone: String(body.phone).trim(),
    numPeople: typeof body.numPeople === "number" ? body.numPeople : 1,
    note: typeof body.note === "string" ? body.note.trim() : undefined,
    authorId: session.id,
  });

  return NextResponse.json({ signup }, { status: 201 });
}
