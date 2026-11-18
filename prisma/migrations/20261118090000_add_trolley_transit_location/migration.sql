-- AlterTable
-- All nullable with no default: every existing trolley keeps having no
-- transit stop, so every route stays two legs and nothing starts waiting.
ALTER TABLE "trolleys" ADD COLUMN "transitLocationCode" TEXT;

-- AlterTable
ALTER TABLE "trolley_activities" ADD COLUMN "transitLocationCode" TEXT,
                                 ADD COLUMN "continueTaskDelaySec" INTEGER,
                                 ADD COLUMN "transitArrivedAt" TIMESTAMP(3),
                                 ADD COLUMN "continuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "trolleys_transitLocationCode_idx" ON "trolleys"("transitLocationCode");

-- CreateIndex
CREATE INDEX "trolley_activities_transitLocationCode_idx" ON "trolley_activities"("transitLocationCode");
