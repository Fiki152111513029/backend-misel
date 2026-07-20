-- CreateTable
CREATE TABLE "warehouse_line_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "droppingLocationCode" TEXT NOT NULL,
    "pickingLocationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "warehouse_line_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_operator_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "warehouse_operator_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_line_locations_name_key" ON "warehouse_line_locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_line_locations_droppingLocationCode_key" ON "warehouse_line_locations"("droppingLocationCode");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_line_locations_pickingLocationCode_key" ON "warehouse_line_locations"("pickingLocationCode");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_operator_locations_name_key" ON "warehouse_operator_locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_operator_locations_locationCode_key" ON "warehouse_operator_locations"("locationCode");
