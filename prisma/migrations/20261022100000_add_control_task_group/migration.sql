-- Heading a Control Task sits under in the Custom Task picker (e.g. WRL23L).
-- Nullable: existing tasks keep working and show under "Other" until given one.
ALTER TABLE "control_tasks" ADD COLUMN "groupName" TEXT;

CREATE INDEX "control_tasks_groupName_idx" ON "control_tasks"("groupName");
