-- CreateTable
CREATE TABLE "quarantine_lines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "quarantine_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarantine_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iRaypleLocationCode" TEXT NOT NULL,
    "quarantineLineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "quarantine_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quarantine_lines_name_key" ON "quarantine_lines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "quarantine_areas_iRaypleLocationCode_key" ON "quarantine_areas"("iRaypleLocationCode");

-- CreateIndex
CREATE INDEX "quarantine_areas_quarantineLineId_idx" ON "quarantine_areas"("quarantineLineId");

-- AddForeignKey
ALTER TABLE "quarantine_areas" ADD CONSTRAINT "quarantine_areas_quarantineLineId_fkey" FOREIGN KEY ("quarantineLineId") REFERENCES "quarantine_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
