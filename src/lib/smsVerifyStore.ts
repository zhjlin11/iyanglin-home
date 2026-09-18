/**
 * 短信验证码内存存储
 *
 * 存储验证码及其过期时间，支持频率限制
 */

interface VerifyEntry {
  code: string;
  expiresAt: number; // ms timestamp
  attempts: number; // 已尝试验证次数
}

interface SendRecord {
  lastSentAt: number;
  countInWindow: number;
  windowStart: number;
}

const store = new Map<string, VerifyEntry>();
const sendRecords = new Map<string, SendRecord>();

const CODE_TTL_MS = 5 * 60 * 1000; // 验证码5分钟有效
const RESEND_COOLDOWN_MS = 60 * 1000; // 60秒内不能重发
const MAX_SENDS_PER_HOUR = 5; // 每小时最多5条
const MAX_VERIFY_ATTEMPTS = 5; // 最多验证5次

/** 检查是否可以发送（频率限制） */
export function canSend(phone: string): { ok: boolean; waitSeconds?: number } {
  const record = sendRecords.get(phone);
  const now = Date.now();

  if (record) {
    // 60秒冷却
    const elapsed = now - record.lastSentAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        waitSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }

    // 每小时限制
    const hourMs = 60 * 60 * 1000;
    if (now - record.windowStart < hourMs && record.countInWindow >= MAX_SENDS_PER_HOUR) {
      return { ok: false, waitSeconds: Math.ceil((record.windowStart + hourMs - now) / 1000) };
    }
  }

  return { ok: true };
}

/** 记录发送 */
export function recordSend(phone: string): void {
  const now = Date.now();
  const existing = sendRecords.get(phone);
  const hourMs = 60 * 60 * 1000;

  if (existing && now - existing.windowStart < hourMs) {
    existing.lastSentAt = now;
    existing.countInWindow++;
  } else {
    sendRecords.set(phone, {
      lastSentAt: now,
      countInWindow: 1,
      windowStart: now,
    });
  }
}

/** 保存验证码 */
export function saveCode(phone: string, code: string): void {
  store.set(phone, {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
  });
}

/** 验证验证码 */
export function verifyCode(
  phone: string,
  code: string
): { valid: boolean; error?: string } {
  const entry = store.get(phone);

  if (!entry) {
    return { valid: false, error: "请先获取验证码" };
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return { valid: false, error: "验证码已过期，请重新获取" };
  }

  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    store.delete(phone);
    return { valid: false, error: "验证次数过多，请重新获取验证码" };
  }

  entry.attempts++;

  if (entry.code !== code) {
    return { valid: false, error: "验证码不正确" };
  }

  // 验证成功，删除记录
  store.delete(phone);
  return { valid: true };
}

/** 清理过期记录（可选定时调用） */
export function cleanup(): void {
  const now = Date.now();
  for (const [phone, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(phone);
    }
  }
}
