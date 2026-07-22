-- AlterTable
ALTER TABLE "model_code_processes" ADD COLUMN     "statusComment1" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statusComment2" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statusComment3" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statusComment4" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statusComment5" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statusComment6" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statusComment7" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "statusComment8" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "production_line_areas" ADD COLUMN     "modelCodeProcessId" TEXT;

-- CreateIndex
CREATE INDEX "production_line_areas_modelCodeProcessId_idx" ON "production_line_areas"("modelCodeProcessId");

-- AddForeignKey
ALTER TABLE "production_line_areas" ADD CONSTRAINT "production_line_areas_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
