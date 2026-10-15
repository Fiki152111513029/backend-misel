-- Custom Task runs held back until their pickup bin is filled.
-- Nullable so existing rows are untouched: a NULL waitingForBinAt means the
-- run was dispatched straight to RCS, which is every row before this.
ALTER TABLE "custom_task_runs" ADD COLUMN "waitingForBinAt" TIMESTAMP(3);
ALTER TABLE "custom_task_runs" ADD COLUMN "waitingForCode" TEXT;

CREATE INDEX "custom_task_runs_waitingForBinAt_idx"
  ON "custom_task_runs"("waitingForBinAt");
