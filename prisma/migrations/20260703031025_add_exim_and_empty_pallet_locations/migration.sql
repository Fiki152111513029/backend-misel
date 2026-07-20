-- CreateTable
CREATE TABLE "exim_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "exim_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empty_pallet_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "empty_pallet_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exim_locations_name_key" ON "exim_locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exim_locations_iRaypleLocationCode_key" ON "exim_locations"("iRaypleLocationCode");

-- CreateIndex
CREATE UNIQUE INDEX "empty_pallet_locations_name_key" ON "empty_pallet_locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "empty_pallet_locations_iRaypleLocationCode_key" ON "empty_pallet_locations"("iRaypleLocationCode");
