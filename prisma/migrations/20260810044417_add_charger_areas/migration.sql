-- CreateTable
CREATE TABLE "charger_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "charger_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "charger_areas_name_idx" ON "charger_areas"("name");

-- CreateIndex
CREATE INDEX "charger_areas_iRaypleLocationCode_idx" ON "charger_areas"("iRaypleLocationCode");

-- Uniqueness among active (non-deleted) rows only, same convention as every
-- other location table (EximLocation, EmptyPalletLocation, etc.).
CREATE UNIQUE INDEX "charger_areas_name_active_key" ON "charger_areas"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "charger_areas_code_active_key" ON "charger_areas"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
