-- The schema's default was changed to 501 but never migrated, so the
-- database kept handing out 502 and `prisma migrate diff` reported the
-- column on every later run. Only the DEFAULT moves; rows already stored
-- keep whatever port they were given.
ALTER TABLE "plc_devices" ALTER COLUMN "port" SET DEFAULT 501;
