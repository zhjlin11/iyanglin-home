import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 服务端让 session 失效（递增 sessionVersion），即使 CDN 过滤 Set-Cookie 也能确保退出
  try {
    const session = await getSession(request);
    if (session && session.id !== "env-admin") {
      await prisma.user.update({
        where: { id: session.id },
        data: { sessionVersion: { increment: 1 } },
      });
    }
  } catch {
    // 即使数据库操作失败也继续清除 cookie
  }

  const response = NextResponse.json({ ok: true });
  const clearOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  };
  for (const name of ["yanglin_session", "yanglin_admin", "yanglin_role"]) {
    response.cookies.set(name, "", clearOpts);
  }
  return response;
}
