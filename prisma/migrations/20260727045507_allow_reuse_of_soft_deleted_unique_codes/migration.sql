-- DropIndex
DROP INDEX "box_types_name_key";

-- DropIndex
DROP INDEX "empty_pallet_locations_iRaypleLocationCode_key";

-- DropIndex
DROP INDEX "empty_pallet_locations_name_key";

-- DropIndex
DROP INDEX "exim_locations_iRaypleLocationCode_key";

-- DropIndex
DROP INDEX "exim_locations_name_key";

-- DropIndex
DROP INDEX "model_code_processes_name_key";

-- DropIndex
DROP INDEX "production_line_areas_iRaypleLocationCode_key";

-- DropIndex
DROP INDEX "production_lines_name_key";

-- DropIndex
DROP INDEX "quarantine_areas_iRaypleLocationCode_key";

-- DropIndex
DROP INDEX "quarantine_lines_name_key";

-- DropIndex
DROP INDEX "robots_amrDeviceNo_key";

-- DropIndex
DROP INDEX "robots_amrDeviceSerialNo_key";

-- DropIndex
DROP INDEX "robots_name_key";

-- DropIndex
DROP INDEX "warehouse_line_locations_droppingLocationCode_key";

-- DropIndex
DROP INDEX "warehouse_line_locations_name_key";

-- DropIndex
DROP INDEX "warehouse_line_locations_pickingLocationCode_key";

-- DropIndex
DROP INDEX "warehouse_operator_locations_locationCode_key";

-- DropIndex
DROP INDEX "warehouse_operator_locations_name_key";

-- CreateIndex
CREATE INDEX "box_types_name_idx" ON "box_types"("name");

-- CreateIndex
CREATE INDEX "empty_pallet_locations_name_idx" ON "empty_pallet_locations"("name");

-- CreateIndex
CREATE INDEX "empty_pallet_locations_iRaypleLocationCode_idx" ON "empty_pallet_locations"("iRaypleLocationCode");

-- CreateIndex
CREATE INDEX "exim_locations_name_idx" ON "exim_locations"("name");

-- CreateIndex
CREATE INDEX "exim_locations_iRaypleLocationCode_idx" ON "exim_locations"("iRaypleLocationCode");

-- CreateIndex
CREATE INDEX "model_code_processes_name_idx" ON "model_code_processes"("name");

-- CreateIndex
CREATE INDEX "production_line_areas_iRaypleLocationCode_idx" ON "production_line_areas"("iRaypleLocationCode");

-- CreateIndex
CREATE INDEX "production_lines_name_idx" ON "production_lines"("name");

-- CreateIndex
CREATE INDEX "quarantine_areas_iRaypleLocationCode_idx" ON "quarantine_areas"("iRaypleLocationCode");

-- CreateIndex
CREATE INDEX "quarantine_lines_name_idx" ON "quarantine_lines"("name");

-- CreateIndex
CREATE INDEX "robots_name_idx" ON "robots"("name");

-- CreateIndex
CREATE INDEX "robots_amrDeviceSerialNo_idx" ON "robots"("amrDeviceSerialNo");

-- CreateIndex
CREATE INDEX "robots_amrDeviceNo_idx" ON "robots"("amrDeviceNo");

-- CreateIndex
CREATE INDEX "warehouse_line_locations_name_idx" ON "warehouse_line_locations"("name");

-- CreateIndex
CREATE INDEX "warehouse_line_locations_droppingLocationCode_idx" ON "warehouse_line_locations"("droppingLocationCode");

-- CreateIndex
CREATE INDEX "warehouse_line_locations_pickingLocationCode_idx" ON "warehouse_line_locations"("pickingLocationCode");

-- CreateIndex
CREATE INDEX "warehouse_operator_locations_name_idx" ON "warehouse_operator_locations"("name");

-- CreateIndex
CREATE INDEX "warehouse_operator_locations_locationCode_idx" ON "warehouse_operator_locations"("locationCode");

-- Partial unique indexes: uniqueness only among non-soft-deleted rows, so a
-- code/name freed up by a soft delete can be reused by a new row. A plain
-- @unique constraint doesn't know about `deletedAt` and was rejecting valid
-- inserts with P2002 whenever the app-level check said the code was free
-- (soft-deleted rows still "owned" the value at the DB level).
CREATE UNIQUE INDEX "box_types_name_active_key" ON "box_types"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "model_code_processes_name_active_key" ON "model_code_processes"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "quarantine_lines_name_active_key" ON "quarantine_lines"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "quarantine_areas_iRaypleLocationCode_active_key" ON "quarantine_areas"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "exim_locations_name_active_key" ON "exim_locations"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "exim_locations_iRaypleLocationCode_active_key" ON "exim_locations"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "empty_pallet_locations_name_active_key" ON "empty_pallet_locations"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "empty_pallet_locations_iRaypleLocationCode_active_key" ON "empty_pallet_locations"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "warehouse_line_locations_name_active_key" ON "warehouse_line_locations"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "warehouse_line_locations_droppingLocationCode_active_key" ON "warehouse_line_locations"("droppingLocationCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "warehouse_line_locations_pickingLocationCode_active_key" ON "warehouse_line_locations"("pickingLocationCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "warehouse_operator_locations_name_active_key" ON "warehouse_operator_locations"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "warehouse_operator_locations_locationCode_active_key" ON "warehouse_operator_locations"("locationCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "production_lines_name_active_key" ON "production_lines"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "production_line_areas_iRaypleLocationCode_active_key" ON "production_line_areas"("iRaypleLocationCode") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "robots_name_active_key" ON "robots"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "robots_amrDeviceSerialNo_active_key" ON "robots"("amrDeviceSerialNo") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "robots_amrDeviceNo_active_key" ON "robots"("amrDeviceNo") WHERE "deletedAt" IS NULL;
