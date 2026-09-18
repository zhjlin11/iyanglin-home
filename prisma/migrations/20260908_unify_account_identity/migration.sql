-- Identity unification: additive, idempotent, and safe for the existing
-- production database (which predates Prisma migration history).
-- Run only after a verified PostgreSQL backup.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarSource" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nicknameSource" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "registrationSource" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginProvider" TEXT;

CREATE TABLE IF NOT EXISTS "WechatAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "openId" TEXT NOT NULL,
  "unionId" TEXT,
  "nickname" TEXT,
  "avatarUrl" TEXT,
  "subscribed" BOOLEAN NOT NULL DEFAULT false,
  "subscribeAt" TIMESTAMP(3),
  "unsubscribeAt" TIMESTAMP(3),
  "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WechatAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LoginLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "provider" TEXT NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "WechatAccount" ADD CONSTRAINT "WechatAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "WechatAccount_appId_openId_key" ON "WechatAccount"("appId", "openId");
CREATE INDEX IF NOT EXISTS "WechatAccount_userId_idx" ON "WechatAccount"("userId");
CREATE INDEX IF NOT EXISTS "WechatAccount_unionId_idx" ON "WechatAccount"("unionId");
CREATE INDEX IF NOT EXISTS "LoginLog_userId_createdAt_idx" ON "LoginLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");

-- The audit found no duplicate legacy credentials. Enforce that finding going
-- forward, without treating NULL provider IDs as equal.
CREATE UNIQUE INDEX IF NOT EXISTS "AuthAccount_userId_provider_key" ON "AuthAccount"("userId", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "AuthAccount_provider_providerAccountId_key"
  ON "AuthAccount"("provider", "providerAccountId") WHERE "providerAccountId" IS NOT NULL;

-- Preserve existing provenance when known; otherwise label history
-- conservatively so OAuth never overwrites legacy/member-edited data.
UPDATE "User"
SET "avatarSource" = CASE
  WHEN "avatar" IS NULL OR "avatar" = '' THEN 'DEFAULT'
  WHEN "wechatAvatar" IS NOT NULL AND "avatar" = "wechatAvatar" THEN 'WECHAT'
  ELSE 'LEGACY'
END
WHERE "avatarSource" IS NULL;
UPDATE "User"
SET "nicknameSource" = CASE
  WHEN "nickname" IS NULL OR "nickname" = '' THEN 'DEFAULT'
  WHEN "wechatNickname" IS NOT NULL AND "nickname" = "wechatNickname" THEN 'WECHAT'
  ELSE 'LEGACY'
END
WHERE "nicknameSource" IS NULL;
UPDATE "User"
SET "registrationSource" = CASE
  WHEN "wechatOpenId" IS NOT NULL THEN 'WECHAT'
  WHEN "phone" IS NOT NULL THEN 'PHONE'
  ELSE 'PASSWORD'
END
WHERE "registrationSource" IS NULL;

-- Backfill the canonical table from legacy data. `legacy-mp` is intentionally
-- stable for historical records; new OAuth records use the real app ID.
INSERT INTO "WechatAccount" (
  "id", "userId", "appId", "openId", "unionId", "nickname", "avatarUrl",
  "subscribed", "subscribeAt", "unsubscribeAt", "boundAt", "lastSyncAt", "createdAt", "updatedAt"
)
SELECT
  'legacy_' || "User"."id", "User"."id", 'legacy-mp', "User"."wechatOpenId",
  "User"."wechatUnionId", "User"."wechatNickname", "User"."wechatAvatar",
  COALESCE(wf."subscribed", false), wf."subscribeTime", wf."unsubscribedAt",
  CURRENT_TIMESTAMP, wf."lastSyncedAt", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
LEFT JOIN "WechatFollower" wf ON wf."userId" = "User"."id"
WHERE "User"."wechatOpenId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "WechatAccount" wa
    WHERE wa."appId" = 'legacy-mp' AND wa."openId" = "User"."wechatOpenId"
  );

INSERT INTO "AuthAccount" ("id", "userId", "provider", "providerAccountId", "createdAt", "updatedAt")
SELECT 'phone_' || "id", "id", 'PHONE', "phone", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
WHERE u."phone" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "AuthAccount" a WHERE a."userId" = u."id" AND a."provider" = 'PHONE');
