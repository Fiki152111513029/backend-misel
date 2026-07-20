-- AlterTable
ALTER TABLE "warehouse_operator_locations" DROP COLUMN "operator",
ADD COLUMN     "operatorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_operator_locations_operatorId_key" ON "warehouse_operator_locations"("operatorId");

-- AddForeignKey
ALTER TABLE "warehouse_operator_locations" ADD CONSTRAINT "warehouse_operator_locations_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

