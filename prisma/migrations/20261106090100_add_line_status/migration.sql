-- Line status: the four buttons a registered Control Task group shows at
-- the foot of Custom Task, and the one row per line they write to.

-- CreateEnum
CREATE TYPE "LineStatusKind" AS ENUM ('RUNNING_LH', 'RUNNING_RH', 'CHANGE_LH', 'CHANGE_RH');

-- AlterTable
-- Opt-in: a group that never asked for the buttons must not grow four.
ALTER TABLE "control_tasks" ADD COLUMN     "lineStatusEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "line_statuses" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "kind" "LineStatusKind" NOT NULL,
    "raisedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- One row per line, replaced on every press: this is the line's current
-- state, not a log of presses.
CREATE UNIQUE INDEX "line_statuses_groupName_key" ON "line_statuses"("groupName");

-- CreateIndex
CREATE INDEX "line_statuses_raisedById_idx" ON "line_statuses"("raisedById");

-- AddForeignKey
-- SET NULL, not CASCADE: removing the operator who pressed the button must
-- not delete the line's current state along with them.
ALTER TABLE "line_statuses" ADD CONSTRAINT "line_statuses_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
