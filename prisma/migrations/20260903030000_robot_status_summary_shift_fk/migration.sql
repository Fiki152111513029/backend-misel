-- DropIndex
DROP INDEX "robot_status_daily_summaries_robotId_date_shift_key";

-- AlterTable
ALTER TABLE "robot_status_daily_summaries" DROP COLUMN "shift",
ADD COLUMN     "shiftId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "RobotShift";

-- CreateIndex
CREATE INDEX "robot_status_daily_summaries_shiftId_idx" ON "robot_status_daily_summaries"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "robot_status_daily_summaries_robotId_date_shiftId_key" ON "robot_status_daily_summaries"("robotId", "date", "shiftId");

-- AddForeignKey
ALTER TABLE "robot_status_daily_summaries" ADD CONSTRAINT "robot_status_daily_summaries_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
