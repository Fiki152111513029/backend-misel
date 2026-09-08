-- AlterTable
ALTER TABLE "trolleys" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- Uniqueness among active (non-deleted) rows only, same convention as every
-- other name-based reference table (ChargerArea, ParkingArea, Shift, etc.).
CREATE UNIQUE INDEX "customers_name_active_key" ON "customers"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "trolleys_customerId_idx" ON "trolleys"("customerId");

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
