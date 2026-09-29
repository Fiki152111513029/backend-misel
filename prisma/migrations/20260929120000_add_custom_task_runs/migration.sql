-- History of every Custom Task actually dispatched to RCS, behind
-- All Tasks > Custom Tasks. The Control Task fields are snapshotted rather
-- than joined, so editing or deleting a Control Task later never rewrites
-- what a past run says it sent.
CREATE TABLE "custom_task_runs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "controlTaskId" TEXT,
    "abjad" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taskPath" TEXT NOT NULL,
    "modelProcessCode" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "robotId" TEXT,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_task_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_task_runs_orderId_key" ON "custom_task_runs"("orderId");
CREATE INDEX "custom_task_runs_controlTaskId_idx" ON "custom_task_runs"("controlTaskId");
CREATE INDEX "custom_task_runs_robotId_idx" ON "custom_task_runs"("robotId");
CREATE INDEX "custom_task_runs_operatorId_idx" ON "custom_task_runs"("operatorId");
CREATE INDEX "custom_task_runs_createdAt_idx" ON "custom_task_runs"("createdAt");

ALTER TABLE "custom_task_runs" ADD CONSTRAINT "custom_task_runs_controlTaskId_fkey" FOREIGN KEY ("controlTaskId") REFERENCES "control_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "custom_task_runs" ADD CONSTRAINT "custom_task_runs_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "robots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "custom_task_runs" ADD CONSTRAINT "custom_task_runs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
