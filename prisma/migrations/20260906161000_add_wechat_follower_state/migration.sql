CREATE TABLE IF NOT EXISTS "WechatFollower" (
  "id" TEXT NOT NULL,
  "openId" TEXT NOT NULL,
  "unionId" TEXT,
  "nickname" TEXT,
  "avatar" TEXT,
  "subscribed" BOOLEAN NOT NULL DEFAULT false,
  "subscribeTime" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "firstSeenSource" TEXT NOT NULL DEFAULT 'OAUTH',
  "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WechatFollower_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WechatFollower_openId_key"
  ON "WechatFollower"("openId");
CREATE UNIQUE INDEX IF NOT EXISTS "WechatFollower_userId_key"
  ON "WechatFollower"("userId");
CREATE INDEX IF NOT EXISTS "WechatFollower_unionId_idx"
  ON "WechatFollower"("unionId");
CREATE INDEX IF NOT EXISTS "WechatFollower_subscribed_idx"
  ON "WechatFollower"("subscribed");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'WechatFollower_userId_fkey'
  ) THEN
    ALTER TABLE "WechatFollower"
      ADD CONSTRAINT "WechatFollower_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
