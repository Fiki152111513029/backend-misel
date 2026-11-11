-- When an AMR last lifted a rack off this node, as reported by RCS's
-- "21 Picked" webhook, and cleared again when that same task ends.
--
-- RCS will not accept a stock-status change on a node one of its own
-- running tasks still holds, so the nodeStatus=0 sent at Picked can be
-- refused and the node keeps reporting 2 until the task completes. The bin
-- guard reads this column to know the rack has already gone.
ALTER TABLE "warehouse_locations" ADD COLUMN     "pickedEmptyAt" TIMESTAMP(3);
