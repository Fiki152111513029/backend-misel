-- Per-task button colour in Custom Task, as #RRGGBB. Nullable: existing
-- tasks fall back to the page's default blue.
ALTER TABLE "control_tasks" ADD COLUMN "colorCode" TEXT;
