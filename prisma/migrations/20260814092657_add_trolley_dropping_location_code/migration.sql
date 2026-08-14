-- AlterTable
ALTER TABLE "trolleys" ADD COLUMN     "droppingLocationCode" TEXT;

-- CreateIndex
CREATE INDEX "trolleys_droppingLocationCode_idx" ON "trolleys"("droppingLocationCode");
