-- CreateEnum
CREATE TYPE "WarehouseCartTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "warehouse_cart_tasks" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskPath" TEXT NOT NULL,
    "status" "WarehouseCartTaskStatus" NOT NULL DEFAULT 'PENDING',
    "warehouseLineLocationId" TEXT NOT NULL,
    "modelCodeProcessId" TEXT NOT NULL,
    "robotId" TEXT,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "warehouse_cart_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_cart_tasks_taskId_key" ON "warehouse_cart_tasks"("taskId");

-- CreateIndex
CREATE INDEX "warehouse_cart_tasks_warehouseLineLocationId_idx" ON "warehouse_cart_tasks"("warehouseLineLocationId");

-- CreateIndex
CREATE INDEX "warehouse_cart_tasks_modelCodeProcessId_idx" ON "warehouse_cart_tasks"("modelCodeProcessId");

-- CreateIndex
CREATE INDEX "warehouse_cart_tasks_robotId_idx" ON "warehouse_cart_tasks"("robotId");

-- CreateIndex
CREATE INDEX "warehouse_cart_tasks_operatorId_idx" ON "warehouse_cart_tasks"("operatorId");

-- AddForeignKey
ALTER TABLE "warehouse_cart_tasks" ADD CONSTRAINT "warehouse_cart_tasks_warehouseLineLocationId_fkey" FOREIGN KEY ("warehouseLineLocationId") REFERENCES "warehouse_line_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_cart_tasks" ADD CONSTRAINT "warehouse_cart_tasks_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_cart_tasks" ADD CONSTRAINT "warehouse_cart_tasks_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "robots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_cart_tasks" ADD CONSTRAINT "warehouse_cart_tasks_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
