import { NextResponse } from "next/server";
import { getQrSession, deleteQrSession } from "@/lib/qrSessions";
import { signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/wechat/qr/check?token=xxx
 * PC browser polls this endpoint to check QR login status.
 * Returns: { status: "pending" | "scanned" | "confirmed" | "expired" }
 * When confirmed, also sets the session cookie for the PC browser.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ status: "expired" });
  }

  const session = getQrSession(token);
  if (!session) {
    return NextResponse.json({ status: "expired" });
  }

  if (session.status === "confirmed" && session.userId) {
    // User authenticated via WeChat on mobile — issue session for PC
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, role: true, avatar: true, wechatAvatar: true, sessionVersion: true },
    });

    if (!user) {
      return NextResponse.json({ status: "expired" });
    }

    const sessionToken = signSession({
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar || user.wechatAvatar || undefined,
      sessionVersion: user.sessionVersion || 1,
    });

    const response = NextResponse.json({ status: "confirmed" });
    response.cookies.set("yanglin_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    // Clean up — one-time use
    deleteQrSession(token);

    return response;
  }

  return NextResponse.json({ status: session.status });
}
