/**
 * [AUDIT FIX P1-01] Global API rate limiter
 * Simple in-memory sliding window rate limiter
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limiters = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Check rate limit for a given key (usually IP)
 * @returns true if rate limited (should block), false if allowed
 */
export function isRateLimited(
  limiterName: string,
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  if (!limiters.has(limiterName)) {
    limiters.set(limiterName, new Map());
  }
  const store = limiters.get(limiterName)!;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(message: string = "请求过于频繁，请稍后再试") {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json" },
  });
}

// Cleanup old entries every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of limiters) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}