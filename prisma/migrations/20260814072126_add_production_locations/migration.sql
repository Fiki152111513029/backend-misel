-- CreateTable
CREATE TABLE "production_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "production_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_locations_name_idx" ON "production_locations"("name");

-- CreateIndex
CREATE INDEX "production_locations_iRaypleLocationCode_idx" ON "production_locations"("iRaypleLocationCode");

-- CreateIndex
CREATE UNIQUE INDEX "production_locations_name_active_key" ON "production_locations"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "production_locations_code_active_key" ON "production_locations"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
