-- Which operators a Control Task was registered to. Custom Task's picker
-- lists only the tasks handed to the signed-in user; scanning a QR label
-- still resolves any task, as before.
CREATE TABLE "control_task_users" (
    "id" TEXT NOT NULL,
    "controlTaskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_task_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "control_task_users_controlTaskId_userId_key"
  ON "control_task_users"("controlTaskId", "userId");
CREATE INDEX "control_task_users_userId_idx" ON "control_task_users"("userId");

ALTER TABLE "control_task_users"
  ADD CONSTRAINT "control_task_users_controlTaskId_fkey"
  FOREIGN KEY ("controlTaskId") REFERENCES "control_tasks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "control_task_users"
  ADD CONSTRAINT "control_task_users_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
