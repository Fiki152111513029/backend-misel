-- What is standing on a warehouse node when RCS cannot say.
-- RCS node status 2 means "empty rack ready to collect", so finished goods
-- must leave RCS reading 0 — otherwise an AMR fetching an empty rack would
-- take the finished goods. This column is how 0 tells its two cases apart.
CREATE TYPE "WarehouseBinContent" AS ENUM ('FINISH_GOOD');

ALTER TABLE "warehouse_locations" ADD COLUMN "binContent" "WarehouseBinContent";
