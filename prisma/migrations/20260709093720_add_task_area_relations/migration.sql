-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "productionLineAreaId" TEXT,
ADD COLUMN     "quarantineAreaId" TEXT;

-- CreateIndex
CREATE INDEX "tasks_productionLineAreaId_idx" ON "tasks"("productionLineAreaId");

-- CreateIndex
CREATE INDEX "tasks_quarantineAreaId_idx" ON "tasks"("quarantineAreaId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_productionLineAreaId_fkey" FOREIGN KEY ("productionLineAreaId") REFERENCES "production_line_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_quarantineAreaId_fkey" FOREIGN KEY ("quarantineAreaId") REFERENCES "quarantine_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
