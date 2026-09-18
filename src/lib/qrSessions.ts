import { randomBytes } from "node:crypto";

/**
 * In-memory QR login session store.
 * PC browser creates a session, displays QR code.
 * WeChat scans QR → opens URL → completes OAuth.
 * PC polls for login completion.
 *
 * Sessions expire after 5 minutes — if server restarts, pending
 * sessions are lost (acceptable; user just refreshes the QR).
 */

export interface QrSession {
  token: string;
  status: "pending" | "scanned" | "confirmed";
  userId?: string;
  createdAt: number;
}

const SESSION_TTL = 5 * 60 * 1000; // 5 minutes
const sessions = new Map<string, QrSession>();

// Periodically clean expired sessions
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions) {
      if (now - session.createdAt > SESSION_TTL) {
        sessions.delete(token);
      }
    }
  }, 60_000);
}

export function createQrSession(): QrSession {
  const token = randomBytes(16).toString("hex");
  const session: QrSession = {
    token,
    status: "pending",
    createdAt: Date.now(),
  };
  sessions.set(token, session);
  return session;
}

export function getQrSession(token: string): QrSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function markScanned(token: string): boolean {
  const session = getQrSession(token);
  if (!session || session.status !== "pending") return false;
  session.status = "scanned";
  return true;
}

export function markConfirmed(token: string, userId: string): boolean {
  const session = getQrSession(token);
  if (!session) return false;
  if (session.status !== "scanned" && session.status !== "pending") return false;
  session.status = "confirmed";
  session.userId = userId;
  return true;
}

export function deleteQrSession(token: string): void {
  sessions.delete(token);
}
