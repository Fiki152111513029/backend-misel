-- CreateEnum
CREATE TYPE "TrolleyStatus" AS ENUM ('FULL', 'EMPTY');

-- CreateTable
CREATE TABLE "trolleys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "TrolleyStatus" NOT NULL DEFAULT 'EMPTY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trolleys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trolleys_name_idx" ON "trolleys"("name");

-- CreateIndex
CREATE INDEX "trolleys_code_idx" ON "trolleys"("code");

-- CreateIndex
CREATE UNIQUE INDEX "trolleys_name_active_key" ON "trolleys"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "trolleys_code_active_key" ON "trolleys"("code") WHERE "deletedAt" IS NULL;
