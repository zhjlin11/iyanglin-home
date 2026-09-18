CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetKind" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingSetting_key_key" ON "BillingSetting"("key");
