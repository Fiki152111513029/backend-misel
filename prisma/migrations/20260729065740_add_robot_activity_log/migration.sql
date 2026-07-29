-- CreateTable
CREATE TABLE "robot_activity_logs" (
    "id" TEXT NOT NULL,
    "robotId" TEXT,
    "deviceCode" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "speed" DOUBLE PRECISION,
    "battery" INTEGER,
    "status" INTEGER,
    "state" TEXT,
    "position" TEXT,
    "payload" TEXT,
    "orientation" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "robot_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "robot_activity_logs_robotId_idx" ON "robot_activity_logs"("robotId");

-- CreateIndex
CREATE INDEX "robot_activity_logs_recordedAt_idx" ON "robot_activity_logs"("recordedAt");

-- AddForeignKey
ALTER TABLE "robot_activity_logs" ADD CONSTRAINT "robot_activity_logs_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "robots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
