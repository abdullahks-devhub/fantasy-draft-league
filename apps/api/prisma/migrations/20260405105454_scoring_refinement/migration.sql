-- AlterTable
ALTER TABLE "MatchParticipant" ADD COLUMN     "isDefense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTitleMatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWorldTitle" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PointRule" ADD COLUMN     "isDefense" BOOLEAN,
ADD COLUMN     "isTitleMatch" BOOLEAN,
ADD COLUMN     "isWorldTitle" BOOLEAN;
