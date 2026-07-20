-- AlterTable
ALTER TABLE "production_line_areas" ADD COLUMN     "modelCodeProcessId" TEXT;

-- CreateTable
CREATE TABLE "model_code_processes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "model_code_processes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "model_code_processes_name_key" ON "model_code_processes"("name");

-- CreateIndex
CREATE INDEX "production_line_areas_modelCodeProcessId_idx" ON "production_line_areas"("modelCodeProcessId");

-- AddForeignKey
ALTER TABLE "production_line_areas" ADD CONSTRAINT "production_line_areas_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
