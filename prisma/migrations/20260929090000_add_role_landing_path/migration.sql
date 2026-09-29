-- Per-role post-login landing page, managed from User Management > Roles.
-- Nullable: an unset role keeps falling back to the built-in default for
-- its name, so nothing changes until an admin picks a page.
ALTER TABLE "roles" ADD COLUMN "landingPath" TEXT;
