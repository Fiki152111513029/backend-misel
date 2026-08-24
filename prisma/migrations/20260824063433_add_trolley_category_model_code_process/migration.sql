-- AlterTable
ALTER TABLE "trolley_categories" ADD COLUMN     "modelCodeProcessId" TEXT;

-- CreateIndex
CREATE INDEX "trolley_categories_modelCodeProcessId_idx" ON "trolley_categories"("modelCodeProcessId");

-- AddForeignKey
ALTER TABLE "trolley_categories" ADD CONSTRAINT "trolley_categories_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
