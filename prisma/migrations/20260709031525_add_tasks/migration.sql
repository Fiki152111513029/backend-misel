-- CreateEnum
CREATE TYPE "TaskAction" AS ENUM ('AMBIL_FG', 'NOT_STANDARD');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskAction" "TaskAction" NOT NULL,
    "taskPath" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "productionLineId" TEXT NOT NULL,
    "modelCodeProcessId" TEXT NOT NULL,
    "robotId" TEXT,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tasks_taskId_key" ON "tasks"("taskId");

-- CreateIndex
CREATE INDEX "tasks_productionLineId_idx" ON "tasks"("productionLineId");

-- CreateIndex
CREATE INDEX "tasks_modelCodeProcessId_idx" ON "tasks"("modelCodeProcessId");

-- CreateIndex
CREATE INDEX "tasks_robotId_idx" ON "tasks"("robotId");

-- CreateIndex
CREATE INDEX "tasks_operatorId_idx" ON "tasks"("operatorId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_productionLineId_fkey" FOREIGN KEY ("productionLineId") REFERENCES "production_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "robots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
