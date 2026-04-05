-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "isFinals" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PointRule" ADD COLUMN     "isFinals" BOOLEAN;
