-- AlterTable
ALTER TABLE "warehouse_line_locations" ADD COLUMN     "modelCodeProcessId" TEXT;

-- CreateIndex
CREATE INDEX "warehouse_line_locations_modelCodeProcessId_idx" ON "warehouse_line_locations"("modelCodeProcessId");

-- AddForeignKey
ALTER TABLE "warehouse_line_locations" ADD CONSTRAINT "warehouse_line_locations_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
