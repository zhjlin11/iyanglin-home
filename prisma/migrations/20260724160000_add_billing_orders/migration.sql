CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'REFUNDED');

CREATE TABLE "BillingOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "planId" TEXT,
    "planName" TEXT NOT NULL,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetTitle" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingOrder_orderNo_key" ON "BillingOrder"("orderNo");
CREATE INDEX "BillingOrder_targetKind_targetId_idx" ON "BillingOrder"("targetKind", "targetId");
CREATE INDEX "BillingOrder_status_idx" ON "BillingOrder"("status");

ALTER TABLE "BillingOrder" ADD CONSTRAINT "BillingOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
