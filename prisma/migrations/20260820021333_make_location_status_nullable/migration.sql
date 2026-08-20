-- AlterTable
ALTER TABLE "production_locations" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "warehouse_locations" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- Reset existing rows to NULL ("no trolley has ever been here" — the plain
-- Factory Map node icon) instead of leaving them at the EMPTY the column
-- previously defaulted every row to regardless of whether a Trolley Task had
-- actually touched that location.
UPDATE "production_locations" SET "status" = NULL;
UPDATE "warehouse_locations" SET "status" = NULL;
