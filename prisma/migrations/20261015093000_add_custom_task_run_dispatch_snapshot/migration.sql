-- What a held Custom Task must be dispatched with, captured at send time so
-- a later edit to the Control Task cannot change what finally goes to RCS.
-- Nullable: rows written before task holding existed never needed them.
ALTER TABLE "custom_task_runs" ADD COLUMN "fromSystem" TEXT;
ALTER TABLE "custom_task_runs" ADD COLUMN "priority" INTEGER;
