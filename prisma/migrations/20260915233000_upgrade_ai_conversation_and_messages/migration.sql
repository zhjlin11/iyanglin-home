-- AlterTable
ALTER TABLE "AiConversation" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AiConversation" ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AiConversation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AiMessage" ADD COLUMN IF NOT EXISTS "sourcesJson" TEXT;
ALTER TABLE "AiMessage" ADD COLUMN IF NOT EXISTS "metadataJson" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiConversation_userId_lastMessageAt_idx" ON "AiConversation"("userId", "lastMessageAt");
