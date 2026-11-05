-- CreateEnum
CREATE TYPE "PlcRegisterType" AS ENUM ('COIL', 'DISCRETE_INPUT', 'HOLDING_REGISTER', 'INPUT_REGISTER');

-- CreateEnum
CREATE TYPE "PlcDataType" AS ENUM ('BOOL', 'INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32');

-- CreateEnum
CREATE TYPE "PlcWordOrder" AS ENUM ('BIG', 'LITTLE');

-- CreateTable
CREATE TABLE "plc_devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 501,
    "unitId" INTEGER NOT NULL DEFAULT 1,
    "pollIntervalMs" INTEGER NOT NULL DEFAULT 1000,
    "timeoutMs" INTEGER NOT NULL DEFAULT 2000,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "plc_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plc_tags" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" INTEGER NOT NULL,
    "registerType" "PlcRegisterType" NOT NULL,
    "dataType" "PlcDataType" NOT NULL DEFAULT 'UINT16',
    "wordOrder" "PlcWordOrder" NOT NULL DEFAULT 'BIG',
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "logEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "plc_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plc_readings" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plc_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plc_devices_name_idx" ON "plc_devices"("name");

-- CreateIndex
CREATE INDEX "plc_tags_deviceId_idx" ON "plc_tags"("deviceId");

-- CreateIndex
CREATE INDEX "plc_tags_name_idx" ON "plc_tags"("name");

-- CreateIndex
CREATE INDEX "plc_readings_tagId_createdAt_idx" ON "plc_readings"("tagId", "createdAt");

-- CreateIndex
CREATE INDEX "plc_readings_createdAt_idx" ON "plc_readings"("createdAt");

-- AddForeignKey
ALTER TABLE "plc_tags" ADD CONSTRAINT "plc_tags_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "plc_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plc_readings" ADD CONSTRAINT "plc_readings_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "plc_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Partial unique indexes, matching the rest of the schema: uniqueness only
-- applies among live rows, so a soft-deleted device or tag frees its name
-- for reuse instead of blocking it forever.
CREATE UNIQUE INDEX "plc_devices_name_key" ON "plc_devices"("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "plc_tags_deviceId_name_key" ON "plc_tags"("deviceId", "name") WHERE "deletedAt" IS NULL;
