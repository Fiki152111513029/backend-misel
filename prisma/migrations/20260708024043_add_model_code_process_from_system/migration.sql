-- CreateEnum
CREATE TYPE "FromSystem" AS ENUM ('MES', 'WMS');

-- AlterTable
ALTER TABLE "model_code_processes" ADD COLUMN     "fromSystem" "FromSystem" NOT NULL DEFAULT 'MES';
