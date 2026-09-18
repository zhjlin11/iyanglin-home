import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-compatible HMAC-SHA256 verification using Web Crypto API
async function verifySessionEdge(token: string): Promise<{ valid: boolean; payload?: any }> {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [data, signature] = parts;
  if (!data || !signature) return { valid: false };

  const secret =
    process.env.AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "Z3FNu3YiLCu6wF6BfDmhyMFLakdRU10EdwZEpjc3vi8c2fzA12P737Ey2K9f51qa";
  if (!secret) return { valid: false };

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

    // Convert to base64url for comparison
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (signature !== expected) return { valid: false };

    const payload = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp || payload.exp < Date.now()) return { valid: false };

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  requestHeaders.set("x-pathname", pathname);

  const requestId = request.headers.get("x-request-id") || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  requestHeaders.set("x-request-id", requestId);


  // [AUDIT FIX P1-03] CSRF protection - check Origin/Referer for mutating API requests
  if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    // Skip CSRF for server-to-server callbacks
    const csrfExempt = [
      "/api/payment/wechat/notify",
      "/api/wechat/official",
    ];
    if (!csrfExempt.some(p => pathname.startsWith(p))) {
      const origin = request.headers.get("origin") || "";
      const referer = request.headers.get("referer") || "";
      const allowed = ["https://iyanglin.com", "https://www.iyanglin.com", "http://localhost:3006"];
      const isAllowed = allowed.some(o => origin.startsWith(o)) || allowed.some(o => referer.startsWith(o));
      if (!isAllowed && origin !== "" && referer !== "") {
        return new NextResponse(JSON.stringify({ error: "请求来源不合法" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // [AUDIT FIX P0-05] Admin route protection: verify session signature + role + expiry
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get("yanglin_session")?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { valid, payload } = await verifySessionEdge(sessionCookie);
    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role - only ADMIN, EDITOR, REVIEWER can access admin pages
    const allowedRoles = ["ADMIN", "EDITOR", "REVIEWER"];
    if (!payload?.role || !allowedRoles.includes(payload.role.toUpperCase())) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      loginUrl.searchParams.set("error", "need_admin_role");
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // [AUDIT FIX] Security response headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Pragma", "no-cache");
  }


  // [AUDIT FIX P2-02] Session sliding window renewal
  // If session has less than half its lifetime remaining (3.5 days), renew it
  if (pathname.startsWith("/api/") || pathname.startsWith("/admin") || pathname === "/profile") {
    const sessionCookie = request.cookies.get("yanglin_session")?.value;
    if (sessionCookie) {
      try {
        const parts = sessionCookie.split(".");
        if (parts.length === 2 && parts[0]) {
          const payload = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
          const remaining = (payload.exp || 0) - Date.now();
          const halfLife = 3.5 * 24 * 60 * 60 * 1000; // 3.5 days
          if (remaining > 0 && remaining < halfLife) {
            // Renew: update exp and re-sign
            const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
            if (secret) {
              payload.exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
              const encoder = new TextEncoder();
              const newData = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
              const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
              const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(newData));
              const newSig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
              const newToken = newData + "." + newSig;
              response.cookies.set("yanglin_session", newToken, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                path: "/",
                maxAge: 7 * 24 * 60 * 60,
              });
            }
          }
        }
      } catch {}
    }
  }

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
