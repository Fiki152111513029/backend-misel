-- CreateEnum
CREATE TYPE "RackStatus" AS ENUM ('FULL', 'EMPTY');

-- CreateEnum
CREATE TYPE "TypeOfGoods" AS ENUM ('PALLET', 'TROLLEY', 'RACK');

-- CreateTable
CREATE TABLE "racks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RackStatus" NOT NULL DEFAULT 'EMPTY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_tasks" (
    "id" TEXT NOT NULL,
    "abjad" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeOfGoods" "TypeOfGoods" NOT NULL,
    "modelCodeProcessId" TEXT NOT NULL,
    "route" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "control_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "racks_name_idx" ON "racks"("name");

-- Uniqueness among active (non-deleted) rows only, same convention as every
-- other name-based reference table (ChargerArea, TrolleyType, etc.).
CREATE UNIQUE INDEX "racks_name_active_key" ON "racks"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "control_tasks_abjad_idx" ON "control_tasks"("abjad");
CREATE INDEX "control_tasks_name_idx" ON "control_tasks"("name");
CREATE INDEX "control_tasks_modelCodeProcessId_idx" ON "control_tasks"("modelCodeProcessId");

CREATE UNIQUE INDEX "control_tasks_abjad_active_key" ON "control_tasks"("abjad") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "control_tasks_name_active_key" ON "control_tasks"("name") WHERE "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "control_tasks" ADD CONSTRAINT "control_tasks_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
