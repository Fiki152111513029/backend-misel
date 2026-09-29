-- Marks a run an operator cancelled. `status` becomes FAILED at the same
-- time (TaskStatus has no CANCELLED member), so this column is what tells
-- a cancelled run apart from one that genuinely failed.
ALTER TABLE "custom_task_runs" ADD COLUMN "cancelledAt" TIMESTAMP(3);
