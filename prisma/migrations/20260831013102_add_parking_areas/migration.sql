-- CreateTable
CREATE TABLE "parking_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "parking_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parking_areas_name_idx" ON "parking_areas"("name");

-- CreateIndex
CREATE INDEX "parking_areas_iRaypleLocationCode_idx" ON "parking_areas"("iRaypleLocationCode");

-- Uniqueness among active (non-deleted) rows only, same convention as every
-- other location table (ChargerArea, EximLocation, EmptyPalletLocation, etc.).
CREATE UNIQUE INDEX "parking_areas_name_active_key" ON "parking_areas"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "parking_areas_code_active_key" ON "parking_areas"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
