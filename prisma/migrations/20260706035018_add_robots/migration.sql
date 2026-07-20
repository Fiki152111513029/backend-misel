-- CreateEnum
CREATE TYPE "RobotState" AS ENUM ('OFFLINE', 'IDLE', 'INTASK');

-- CreateTable
CREATE TABLE "robots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amrDeviceSerialNo" TEXT NOT NULL,
    "amrDeviceNo" TEXT NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "battery" INTEGER NOT NULL DEFAULT 0,
    "state" "RobotState" NOT NULL DEFAULT 'OFFLINE',
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "robots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "robots_name_key" ON "robots"("name");

-- CreateIndex
CREATE UNIQUE INDEX "robots_amrDeviceSerialNo_key" ON "robots"("amrDeviceSerialNo");

-- CreateIndex
CREATE UNIQUE INDEX "robots_amrDeviceNo_key" ON "robots"("amrDeviceNo");
