-- CreateTable
CREATE TABLE "trolley_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trolley_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trolley_types_name_idx" ON "trolley_types"("name");

-- Uniqueness among active (non-deleted) rows only, same convention as every
-- other name-based reference table (ChargerArea, ParkingArea, Customer, etc.).
CREATE UNIQUE INDEX "trolley_types_name_active_key" ON "trolley_types"("name") WHERE "deletedAt" IS NULL;

-- Seed a default Trolley Type and backfill every existing trolley onto it,
-- so trolleyTypeId can be made NOT NULL below without breaking existing rows.
INSERT INTO "trolley_types" ("id", "name", "isActive", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Umum', true, CURRENT_TIMESTAMP);

-- AlterTable (nullable first so the backfill below can populate it)
ALTER TABLE "trolleys" ADD COLUMN     "trolleyTypeId" TEXT;

UPDATE "trolleys" SET "trolleyTypeId" = '00000000-0000-0000-0000-000000000001' WHERE "trolleyTypeId" IS NULL;

ALTER TABLE "trolleys" ALTER COLUMN "trolleyTypeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "trolleys_trolleyTypeId_idx" ON "trolleys"("trolleyTypeId");

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_trolleyTypeId_fkey" FOREIGN KEY ("trolleyTypeId") REFERENCES "trolley_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop the old GLOBAL uniqueness on name/code and replace it with uniqueness
-- scoped per Trolley Type, so two trolleys can now share a name/code as long
-- as they belong to different Types.
DROP INDEX "trolleys_name_active_key";
DROP INDEX "trolleys_code_active_key";

CREATE UNIQUE INDEX "trolleys_name_type_active_key" ON "trolleys"("name", "trolleyTypeId") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "trolleys_code_type_active_key" ON "trolleys"("code", "trolleyTypeId") WHERE "deletedAt" IS NULL;
