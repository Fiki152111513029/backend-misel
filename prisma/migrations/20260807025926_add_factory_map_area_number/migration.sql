-- AlterTable
ALTER TABLE "factory_maps" ADD COLUMN     "areaNumber" INTEGER;

-- CreateIndex
CREATE INDEX "factory_maps_areaNumber_idx" ON "factory_maps"("areaNumber");

-- Uniqueness among active (non-deleted) rows only, same convention as
-- name — a partial index also naturally allows multiple NULLs (existing
-- maps that predate this field), so it doesn't need a backfill.
CREATE UNIQUE INDEX "factory_maps_area_number_active_key" ON "factory_maps"("areaNumber") WHERE "deletedAt" IS NULL;
