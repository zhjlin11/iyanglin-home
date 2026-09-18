/**
 * [AUDIT FIX P1-03] CSRF protection via Origin/Referer header check
 * For API routes that perform state-changing operations
 */

const ALLOWED_ORIGINS = [
  "https://iyanglin.com",
  "https://www.iyanglin.com",
  "http://localhost:3006",
];

/**
 * Verify that a mutating request comes from our own origin.
 * Returns true if the request is safe, false if it should be blocked.
 */
export function verifyCsrf(request: Request): boolean {
  const method = request.method.toUpperCase();
  // Only check mutating methods
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // If Origin header is present, check it
  if (origin) {
    return ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  }

  // Fall back to Referer
  if (referer) {
    return ALLOWED_ORIGINS.some((o) => referer.startsWith(o));
  }

  // No Origin or Referer on a mutating request - block it
  // Exception: server-to-server callbacks (WeChat notify) are handled separately
  return false;
}

/**
 * CSRF rejection response
 */
export function csrfRejectResponse() {
  return new Response(JSON.stringify({ error: "请求来源不合法" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}