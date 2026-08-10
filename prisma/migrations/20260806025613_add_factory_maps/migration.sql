-- CreateTable
CREATE TABLE "factory_maps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "topologyPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "factory_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "factory_maps_name_idx" ON "factory_maps"("name");

-- @unique constraint doesn't know about `deletedAt` — use a partial unique
-- index so a soft-deleted map's name can be reused, matching the rest of
-- the app's soft-delete convention.
CREATE UNIQUE INDEX "factory_maps_name_active_key" ON "factory_maps"("name") WHERE "deletedAt" IS NULL;
