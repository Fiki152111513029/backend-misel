-- CreateEnum
CREATE TYPE "WarehouseLocationStatus" AS ENUM ('FULL', 'EMPTY');

-- AlterTable
ALTER TABLE "warehouse_locations" ADD COLUMN     "status" "WarehouseLocationStatus" NOT NULL DEFAULT 'EMPTY';
