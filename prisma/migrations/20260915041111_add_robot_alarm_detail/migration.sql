-- AlterTable
ALTER TABLE "robot_alarms" ADD COLUMN "alarmDetail" JSONB;
ALTER TABLE "robot_alarms" ADD COLUMN "alarmDetailFetchedAt" TIMESTAMP(3);
