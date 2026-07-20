-- CreateTable
CREATE TABLE "request_boxes" (
    "id" TEXT NOT NULL,
    "productionLineId" TEXT NOT NULL,
    "boxTypeId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "request_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_boxes_productionLineId_idx" ON "request_boxes"("productionLineId");

-- CreateIndex
CREATE INDEX "request_boxes_boxTypeId_idx" ON "request_boxes"("boxTypeId");

-- AddForeignKey
ALTER TABLE "request_boxes" ADD CONSTRAINT "request_boxes_productionLineId_fkey" FOREIGN KEY ("productionLineId") REFERENCES "production_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_boxes" ADD CONSTRAINT "request_boxes_boxTypeId_fkey" FOREIGN KEY ("boxTypeId") REFERENCES "box_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
