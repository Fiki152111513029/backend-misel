-- AlterTable
ALTER TABLE "quarantine_lines" ADD COLUMN     "modelCodeProcessId" TEXT;

-- CreateIndex
CREATE INDEX "quarantine_lines_modelCodeProcessId_idx" ON "quarantine_lines"("modelCodeProcessId");

-- AddForeignKey
ALTER TABLE "quarantine_lines" ADD CONSTRAINT "quarantine_lines_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
