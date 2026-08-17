-- AlterTable
ALTER TABLE "trolleys" ADD COLUMN     "modelCodeProcessId" TEXT;

-- CreateTable
CREATE TABLE "trolley_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trolleyId" TEXT NOT NULL,
    "statusBeginning" "TrolleyStatus" NOT NULL,
    "statusEnd" "TrolleyStatus" NOT NULL,
    "pickupLocationCode" TEXT NOT NULL,
    "droppingLocationCode" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "robotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trolley_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trolley_activities_taskId_key" ON "trolley_activities"("taskId");

-- CreateIndex
CREATE INDEX "trolley_activities_userId_idx" ON "trolley_activities"("userId");

-- CreateIndex
CREATE INDEX "trolley_activities_trolleyId_idx" ON "trolley_activities"("trolleyId");

-- CreateIndex
CREATE INDEX "trolley_activities_taskId_idx" ON "trolley_activities"("taskId");

-- CreateIndex
CREATE INDEX "trolley_activities_robotId_idx" ON "trolley_activities"("robotId");

-- CreateIndex
CREATE INDEX "trolleys_modelCodeProcessId_idx" ON "trolleys"("modelCodeProcessId");

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_modelCodeProcessId_fkey" FOREIGN KEY ("modelCodeProcessId") REFERENCES "model_code_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trolley_activities" ADD CONSTRAINT "trolley_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trolley_activities" ADD CONSTRAINT "trolley_activities_trolleyId_fkey" FOREIGN KEY ("trolleyId") REFERENCES "trolleys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trolley_activities" ADD CONSTRAINT "trolley_activities_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "robots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
