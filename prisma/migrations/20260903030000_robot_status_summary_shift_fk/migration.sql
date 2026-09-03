-- robot_status_daily_summaries is a fully regenerable rollup cache (see
-- RobotStatusRollupService) — nothing else references it, and there's no
-- sound way to map its old SESI_1/SESI_2 enum values onto the new dynamic
-- Shift table's ids (those rows are user-created, not seeded, and may not
-- exist yet). Clearing it here is safe: the nightly cron rebuilds it from
-- RobotActivityLog once real Shift rows exist.
DELETE FROM "robot_status_daily_summaries";

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
