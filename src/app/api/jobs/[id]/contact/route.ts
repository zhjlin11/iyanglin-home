import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJobBody } from "@/lib/job-parser";

type RouteParams = { params: Promise<{ id: string }> };

// Simple in-memory rate limiter (20 requests per minute per IP/User)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 20, windowMs = 60000): { isLimited: boolean; current: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { isLimited: false, current: 1 };
  }

  record.count += 1;
  if (record.count > limit) {
    return { isLimited: true, current: record.count };
  }

  return { isLimited: false, current: record.count };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getSession(request);

  // Extract IP from headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const rateLimitKey = session ? `user:${session.id}` : `ip:${clientIp}`;

  // Rate limit check
  const { isLimited } = checkRateLimit(rateLimitKey, 20, 60000);
  if (isLimited) {
    if (session) {
      await prisma.operationLog.create({
        data: {
          action: "rate_limit_exceeded",
          targetId: id,
          userId: session.id === "env-admin" ? null : session.id,
          metadata: { key: rateLimitKey, ip: clientIp, timestamp: new Date().toISOString() },
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        code: "TOO_MANY_REQUESTS",
        message: "联系方式查看过于频繁，请1分钟后再试",
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  }

  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, title: true, company: true, body: true, status: true, authorId: true },
  });

  if (!job || job.status !== "APPROVED") {
    return NextResponse.json(
      { success: false, code: "NOT_FOUND", error: "岗位不存在或未审核" },
      {
        status: 404,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }

  const parsed = parseJobBody(job.body);

  let rawPhone = parsed.contact || "";
  if (!rawPhone) {
    const phoneMatch = job.body.match(/1[3-9]\d{9}/);
    if (phoneMatch) rawPhone = phoneMatch[0];
  }

  // Fallback: 如果岗位未填电话，查发布者 User 手机号
  if (!rawPhone && (job as any).authorId) {
    const user = await prisma.user.findUnique({
      where: { id: (job as any).authorId },
      select: { phone: true }
    });
    if (user?.phone) rawPhone = user.phone;
  }

  // Fallback: 如果还是没有，按公司名查企业 Shop 电话
  if (!rawPhone && job.company) {
    try {
      const shop = await prisma.shop.findFirst({
        where: { name: { contains: job.company.trim() } },
        select: { phone: true }
      });
      if (shop?.phone) rawPhone = shop.phone;
    } catch {}
  }

  if (!rawPhone) {
    return NextResponse.json(
      { success: false, code: "CONTACT_UNAVAILABLE", hasPhone: false },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }

  const maskedPhone = rawPhone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");

  // Unauthenticated users ONLY get maskedPhone
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        code: "LOGIN_REQUIRED",
        maskedPhone,
        hasPhone: true,
        message: "未登录用户无法获取完整联系方式，请先登录",
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }

  // Authenticated users get full rawPhone
  await prisma.operationLog.create({
    data: {
      action: "view_job_contact",
      targetId: job.id,
      userId: session.id === "env-admin" ? null : session.id,
      metadata: {
        jobId: job.id,
        title: job.title,
        viewer: session.username,
      },
    },
  });

  return NextResponse.json(
    {
      success: true,
      hasPhone: true,
      phone: rawPhone,
      maskedPhone,
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    }
  );
}
