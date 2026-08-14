-- AlterTable
ALTER TABLE "trolleys" ADD COLUMN     "trolleyCategoryId" TEXT;

-- CreateTable
CREATE TABLE "trolley_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trolley_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trolley_categories_name_idx" ON "trolley_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "trolley_categories_name_active_key" ON "trolley_categories"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "trolleys_trolleyCategoryId_idx" ON "trolleys"("trolleyCategoryId");

-- AddForeignKey
ALTER TABLE "trolleys" ADD CONSTRAINT "trolleys_trolleyCategoryId_fkey" FOREIGN KEY ("trolleyCategoryId") REFERENCES "trolley_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
