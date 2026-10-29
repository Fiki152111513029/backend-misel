-- Colour of the group heading in the Custom Task picker, as #RRGGBB.
-- Nullable: every existing row keeps the default blue heading.
ALTER TABLE "control_tasks" ADD COLUMN "groupColor" TEXT;
