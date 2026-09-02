-- CreateEnum
CREATE TYPE "RobotShift" AS ENUM ('SESI_1', 'SESI_2');

-- DropIndex
DROP INDEX "robot_status_daily_summaries_robotId_date_key";

-- AlterTable
ALTER TABLE "robot_status_daily_summaries" ADD COLUMN     "shift" "RobotShift" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "robot_status_daily_summaries_robotId_date_shift_key" ON "robot_status_daily_summaries"("robotId", "date", "shift");
