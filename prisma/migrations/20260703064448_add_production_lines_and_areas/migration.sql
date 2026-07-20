-- CreateEnum
CREATE TYPE "ProductionLineAreaType" AS ENUM ('PRODUCTION', 'STOCK');

-- CreateTable
CREATE TABLE "production_lines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quarantineLineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "production_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_line_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductionLineAreaType" NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "productionLineId" TEXT NOT NULL,
    "eximLocationId" TEXT NOT NULL,
    "emptyPalletLocationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "production_line_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_lines_name_key" ON "production_lines"("name");

-- CreateIndex
CREATE INDEX "production_lines_quarantineLineId_idx" ON "production_lines"("quarantineLineId");

-- CreateIndex
CREATE INDEX "production_lines_operatorId_idx" ON "production_lines"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "production_line_areas_iRaypleLocationCode_key" ON "production_line_areas"("iRaypleLocationCode");

-- CreateIndex
CREATE INDEX "production_line_areas_productionLineId_idx" ON "production_line_areas"("productionLineId");

-- CreateIndex
CREATE INDEX "production_line_areas_eximLocationId_idx" ON "production_line_areas"("eximLocationId");

-- CreateIndex
CREATE INDEX "production_line_areas_emptyPalletLocationId_idx" ON "production_line_areas"("emptyPalletLocationId");

-- AddForeignKey
ALTER TABLE "production_lines" ADD CONSTRAINT "production_lines_quarantineLineId_fkey" FOREIGN KEY ("quarantineLineId") REFERENCES "quarantine_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_lines" ADD CONSTRAINT "production_lines_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_line_areas" ADD CONSTRAINT "production_line_areas_productionLineId_fkey" FOREIGN KEY ("productionLineId") REFERENCES "production_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_line_areas" ADD CONSTRAINT "production_line_areas_eximLocationId_fkey" FOREIGN KEY ("eximLocationId") REFERENCES "exim_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_line_areas" ADD CONSTRAINT "production_line_areas_emptyPalletLocationId_fkey" FOREIGN KEY ("emptyPalletLocationId") REFERENCES "empty_pallet_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
