/*
  Warnings:

  - Made the column `statusEnd` on table `trolley_activities` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `trolley_activities` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "trolley_activities" ALTER COLUMN "statusEnd" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;
