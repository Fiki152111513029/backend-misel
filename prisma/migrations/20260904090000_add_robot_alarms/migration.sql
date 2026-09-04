-- CreateTable
CREATE TABLE "robot_alarms" (
    "id" TEXT NOT NULL,
    "deviceNum" TEXT,
    "deviceName" TEXT,
    "alarmDesc" TEXT,
    "alarmType" INTEGER,
    "areaId" INTEGER,
    "alarmReadFlag" INTEGER,
    "channelDeviceId" TEXT,
    "alarmSource" TEXT,
    "channelName" TEXT,
    "alarmDateRaw" TEXT,
    "alarmGrade" INTEGER,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "robot_alarms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "robot_alarms_receivedAt_idx" ON "robot_alarms"("receivedAt");

-- CreateIndex
CREATE INDEX "robot_alarms_alarmGrade_idx" ON "robot_alarms"("alarmGrade");

-- CreateIndex
CREATE INDEX "robot_alarms_areaId_idx" ON "robot_alarms"("areaId");
