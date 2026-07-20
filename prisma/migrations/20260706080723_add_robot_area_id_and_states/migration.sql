-- AlterEnum
BEGIN;
CREATE TYPE "RobotState_new" AS ENUM ('IDLE', 'INITIALIZING', 'IN_TASK', 'FAULT', 'OFFLINE', 'CHARGING', 'UPGRADING');
ALTER TABLE "public"."robots" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "robots" ALTER COLUMN "state" TYPE "RobotState_new" USING ("state"::text::"RobotState_new");
ALTER TYPE "RobotState" RENAME TO "RobotState_old";
ALTER TYPE "RobotState_new" RENAME TO "RobotState";
DROP TYPE "public"."RobotState_old";
ALTER TABLE "robots" ALTER COLUMN "state" SET DEFAULT 'OFFLINE';
COMMIT;

-- AlterTable: add areaId as nullable first (existing rows need a value)
ALTER TABLE "robots" ADD COLUMN "areaId" INTEGER;

-- Backfill existing rows with sequential distinct areaId values starting at 1
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "robots"
)
UPDATE "robots" r
SET "areaId" = numbered.rn
FROM numbered
WHERE r.id = numbered.id;

-- Enforce NOT NULL + UNIQUE now that every row has a value
ALTER TABLE "robots" ALTER COLUMN "areaId" SET NOT NULL;
CREATE UNIQUE INDEX "robots_areaId_key" ON "robots"("areaId");
