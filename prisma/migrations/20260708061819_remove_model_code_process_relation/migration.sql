-- DropForeignKey
ALTER TABLE "production_line_areas" DROP CONSTRAINT "production_line_areas_modelCodeProcessId_fkey";

-- DropIndex
DROP INDEX "production_line_areas_modelCodeProcessId_idx";

-- AlterTable
ALTER TABLE "production_line_areas" DROP COLUMN "modelCodeProcessId";
