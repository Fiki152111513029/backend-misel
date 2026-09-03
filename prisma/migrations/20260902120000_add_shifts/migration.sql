-- AlterTable
ALTER TABLE "users" ADD COLUMN     "shiftId" TEXT;

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shifts_name_idx" ON "shifts"("name");

-- Uniqueness among active (non-deleted) rows only, same convention as
-- every other named entity (ChargerArea, ParkingArea, etc.).
CREATE UNIQUE INDEX "shifts_name_active_key" ON "shifts"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "users_shiftId_idx" ON "users"("shiftId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
