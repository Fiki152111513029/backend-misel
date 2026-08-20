-- CreateEnum
CREATE TYPE "ProductionLocationStatus" AS ENUM ('FULL', 'EMPTY');

-- AlterTable
ALTER TABLE "production_locations" ADD COLUMN     "status" "ProductionLocationStatus" NOT NULL DEFAULT 'EMPTY';
