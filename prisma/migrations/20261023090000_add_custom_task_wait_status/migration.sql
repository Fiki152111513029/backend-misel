-- Which bin state releases a parked Custom Task: '2' (pickup must fill) or
-- '0' (drop must clear). Rows parked before this only ever waited on a
-- pickup, so they are backfilled to '2'.
ALTER TABLE "custom_task_runs" ADD COLUMN "waitingForStatus" TEXT;

UPDATE "custom_task_runs"
   SET "waitingForStatus" = '2'
 WHERE "waitingForBinAt" IS NOT NULL;
