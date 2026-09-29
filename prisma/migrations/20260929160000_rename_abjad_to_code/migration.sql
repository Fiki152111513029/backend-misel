-- "abjad" renamed to "code", matching how every other scannable identifier
-- in this app is named (Trolley.code, iRaypleLocationCode). RENAME keeps the
-- existing rows and the unique/index guarantees intact — this is purely a
-- naming change, no data is rewritten.
ALTER TABLE "control_tasks" RENAME COLUMN "abjad" TO "code";
ALTER INDEX "control_tasks_abjad_idx" RENAME TO "control_tasks_code_idx";
ALTER INDEX "control_tasks_abjad_active_key" RENAME TO "control_tasks_code_active_key";

ALTER TABLE "custom_task_runs" RENAME COLUMN "abjad" TO "code";
