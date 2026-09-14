-- AlterTable
ALTER TABLE "robot_alarms" ADD COLUMN     "alarmCode" TEXT;

-- AlterTable
ALTER TABLE "robot_status_daily_summaries" ADD COLUMN     "alarmMinutes" INTEGER NOT NULL DEFAULT 0;
