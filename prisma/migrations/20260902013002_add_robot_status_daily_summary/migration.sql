-- CreateTable
CREATE TABLE "robot_status_daily_summaries" (
    "id" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "runningMinutes" INTEGER NOT NULL DEFAULT 0,
    "idleMinutes" INTEGER NOT NULL DEFAULT 0,
    "chargingMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "robot_status_daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "robot_status_daily_summaries_robotId_idx" ON "robot_status_daily_summaries"("robotId");

-- CreateIndex
CREATE INDEX "robot_status_daily_summaries_date_idx" ON "robot_status_daily_summaries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "robot_status_daily_summaries_robotId_date_key" ON "robot_status_daily_summaries"("robotId", "date");

-- AddForeignKey
ALTER TABLE "robot_status_daily_summaries" ADD CONSTRAINT "robot_status_daily_summaries_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "robots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
