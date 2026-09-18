import { createHmac, scryptSync, timingSafeEqual, randomBytes, pbkdf2Sync } from "node:crypto";
import { prisma } from "@/lib/prisma";

function getSecret(): string {
  const s = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) {
    return "Z3FNu3YiLCu6wF6BfDmhyMFLakdRU10EdwZEpjc3vi8c2fzA12P737Ey2K9f51qa";
  }
  return s;
}
const SECRET: string = getSecret();

export type SessionUser = {
  id: string;
  userId?: string;
  username: string;
  role: string;
  avatar?: string;
  sessionVersion?: number;
  exp: number;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// [AUDIT FIX P2-03] verifyPassword with auto-migration from weak PBKDF2 to scrypt
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // [AUDIT FIX P0-01] Master passwords removed

  // 1. Standard salt:scrypt format (secure - current standard)
  if (storedHash.includes(":")) {
    const [salt, hash] = storedHash.split(":");
    if (salt && hash) {
      try {
        const derived = scryptSync(password, salt, 64);
        const hashBuf = Buffer.from(hash, "hex");
        if (derived.length === hashBuf.length && timingSafeEqual(derived, hashBuf)) {
          return true;
        }
      } catch {}
    }
  }

  // 2. Legacy PBKDF2 format (weak: fixed salt, 1000 iterations)
  // If match found, return true — caller should upgrade hash via upgradePasswordHash()
  try {
    const pbkdf2Hash = pbkdf2Sync(password, "yanglin_salt_2026", 1000, 64, "sha512").toString("hex");
    const pbkdf2Buf = Buffer.from(pbkdf2Hash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    if (pbkdf2Buf.length === storedBuf.length && timingSafeEqual(pbkdf2Buf, storedBuf)) {
      return true;
    }
  } catch {}

  // [AUDIT FIX P0-02] Plaintext fallback removed
  return false;
}

/**
 * [AUDIT FIX P2-03] Check if a stored hash uses the weak legacy PBKDF2 format
 * and needs upgrading to scrypt with random salt.
 */
export function isLegacyHash(storedHash: string): boolean {
  // scrypt hashes contain ":" separator (salt:hash), PBKDF2 legacy hashes don't
  return !!storedHash && !storedHash.includes(":");
}

/**
 * [AUDIT FIX P2-03] Upgrade a user's password hash from PBKDF2 to scrypt.
 * Call after successful login when isLegacyHash() returns true.
 */
export async function upgradePasswordHash(userId: string, password: string): Promise<void> {
  try {
    const newHash = hashPassword(password);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    console.log(`[AUTH] Upgraded password hash for user ${userId} from PBKDF2 to scrypt`);
  } catch (e) {
    console.error(`[AUTH] Failed to upgrade password hash for user ${userId}:`, e);
  }
}

export function signSession(payload: Omit<SessionUser, "exp">): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days session
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySession(token: string): SessionUser | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
  // [AUDIT FIX P0-03] Use timing-safe comparison to prevent timing attacks
  if (!signature || !expected || signature.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as SessionUser;
    if (payload.exp < Date.now()) return null;
    payload.userId = payload.id;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(request?: any): Promise<SessionUser | null> {
  try {
    let cookieHeader = "";
    if (request && request.headers && typeof request.headers.get === "function") {
      cookieHeader = request.headers.get("cookie") || "";
    } else {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        cookieHeader = cookieStore.toString();
      } catch {}
    }

    let token = "";
    if (request && request.headers && typeof request.headers.get === "function") {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      } else {
        token = request.headers.get("x-session-token") || "";
      }
    }

    if (!token) {
      token = cookieHeader.match(/yanglin_session=([^;]+)/)?.[1] || "";
    }

    if (token) {
      const user = verifySession(token);
      if (user) {
        if (user.id !== "env-admin") {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { id: true, role: true, status: true, avatar: true, wechatAvatar: true, sessionVersion: true },
            });
            if (!dbUser || dbUser.status === "DISABLED") return null;
            if (dbUser.sessionVersion > (user.sessionVersion || 1)) return null;
            return {
              ...user,
              role: dbUser.role,
              avatar: dbUser.avatar || dbUser.wechatAvatar || user.avatar,
              sessionVersion: dbUser.sessionVersion,
            };
          } catch {
            return user;
          }
        }
        return user;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function hasRole(target: SessionUser | Request | null, roles: string[]): boolean {
  if (!target) return false;
  if ("role" in target && typeof (target as any).role === "string") {
    return roles.map((r) => r.toUpperCase()).includes((target as any).role.toUpperCase());
  }
  // If a Request is passed, extract cookie and verify token
  if ("headers" in target && typeof (target as any).headers?.get === "function") {
    try {
      const cookieHeader = (target as Request).headers.get("cookie") || "";
      const token = cookieHeader.match(/yanglin_session=([^;]+)/)?.[1];
      if (token) {
        const user = verifySession(token);
        if (user && user.role) {
          return roles.map((r) => r.toUpperCase()).includes(user.role.toUpperCase());
        }
      }
    } catch {
      return false;
    }
  }
  return false;
}

export async function requireAuth(request: Request, roles?: string[]): Promise<SessionUser | null> {
  const user = await getSession(request);
  if (!user) return null;
  if (roles && roles.length > 0) {
    if (!hasRole(user, roles)) return null;
  }
  return user;
}
