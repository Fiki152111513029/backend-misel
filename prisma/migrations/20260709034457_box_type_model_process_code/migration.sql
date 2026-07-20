/*
  Warnings:

  - You are about to drop the column `modelCodeProcessId` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `boxTypeId` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_modelCodeProcessId_fkey";

-- DropIndex
DROP INDEX "tasks_modelCodeProcessId_idx";

-- AlterTable
ALTER TABLE "box_types" ADD COLUMN     "fromSystem" "FromSystem" NOT NULL DEFAULT 'MES',
ADD COLUMN     "modelProcessCode" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "modelCodeProcessId",
ADD COLUMN     "boxTypeId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "tasks_boxTypeId_idx" ON "tasks"("boxTypeId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_boxTypeId_fkey" FOREIGN KEY ("boxTypeId") REFERENCES "box_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
