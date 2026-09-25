-- Racks and the Type of Goods classification were dropped from the Control
-- Task feature before it went into use: a Control Task is defined by its
-- route and Model Code Process alone.

-- DropTable
DROP TABLE IF EXISTS "racks";

-- DropEnum
DROP TYPE IF EXISTS "RackStatus";

-- AlterTable
ALTER TABLE "control_tasks" DROP COLUMN IF EXISTS "typeOfGoods";

-- DropEnum
DROP TYPE IF EXISTS "TypeOfGoods";
