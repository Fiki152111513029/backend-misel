-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouse_locations_name_idx" ON "warehouse_locations"("name");

-- CreateIndex
CREATE INDEX "warehouse_locations_iRaypleLocationCode_idx" ON "warehouse_locations"("iRaypleLocationCode");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_name_active_key" ON "warehouse_locations"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_locations_code_active_key" ON "warehouse_locations"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
