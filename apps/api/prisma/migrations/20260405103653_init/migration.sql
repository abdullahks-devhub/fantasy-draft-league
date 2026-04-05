-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "RosterStatus" AS ENUM ('ACTIVE', 'BENCH', 'IR');

-- CreateEnum
CREATE TYPE "Result" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- CreateEnum
CREATE TYPE "WaiverAction" AS ENUM ('ADD', 'DROP');

-- CreateEnum
CREATE TYPE "WaiverStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeason" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wrestler" (
    "id" TEXT NOT NULL,
    "cagematchId" TEXT,
    "name" TEXT NOT NULL,
    "currentTeam" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wrestler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrestlerAlias" (
    "id" TEXT NOT NULL,
    "wrestlerId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "WrestlerAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionStatus" (
    "id" TEXT NOT NULL,
    "wrestlerId" TEXT NOT NULL,
    "titleName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChampionStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterSlot" (
    "id" TEXT NOT NULL,
    "playerSeasonId" TEXT NOT NULL,
    "wrestlerId" TEXT NOT NULL,
    "status" "RosterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RosterSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "cagematchId" TEXT,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "promotion" TEXT NOT NULL,
    "showType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "cagematchId" TEXT,
    "matchType" TEXT NOT NULL,
    "isMainEvent" BOOLEAN NOT NULL DEFAULT false,
    "isTournament" BOOLEAN NOT NULL DEFAULT false,
    "tournamentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "wrestlerId" TEXT NOT NULL,
    "result" "Result" NOT NULL,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointRule" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "showType" TEXT,
    "matchType" TEXT,
    "result" "Result",
    "isMainEvent" BOOLEAN,
    "isTournament" BOOLEAN,
    "tournamentName" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PointRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPoint" (
    "id" TEXT NOT NULL,
    "playerSeasonId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "pointsBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaiverMove" (
    "id" TEXT NOT NULL,
    "playerSeasonId" TEXT NOT NULL,
    "wrestlerId" TEXT NOT NULL,
    "action" "WaiverAction" NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" "WaiverStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaiverMove_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeason_userId_seasonId_key" ON "PlayerSeason"("userId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Wrestler_cagematchId_key" ON "Wrestler"("cagematchId");

-- CreateIndex
CREATE UNIQUE INDEX "RosterSlot_playerSeasonId_wrestlerId_key" ON "RosterSlot"("playerSeasonId", "wrestlerId");

-- CreateIndex
CREATE UNIQUE INDEX "Show_cagematchId_key" ON "Show"("cagematchId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_cagematchId_key" ON "Match"("cagematchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_wrestlerId_key" ON "MatchParticipant"("matchId", "wrestlerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPoint_playerSeasonId_weekNumber_key" ON "PlayerPoint"("playerSeasonId", "weekNumber");

-- AddForeignKey
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeason" ADD CONSTRAINT "PlayerSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrestlerAlias" ADD CONSTRAINT "WrestlerAlias_wrestlerId_fkey" FOREIGN KEY ("wrestlerId") REFERENCES "Wrestler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionStatus" ADD CONSTRAINT "ChampionStatus_wrestlerId_fkey" FOREIGN KEY ("wrestlerId") REFERENCES "Wrestler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterSlot" ADD CONSTRAINT "RosterSlot_playerSeasonId_fkey" FOREIGN KEY ("playerSeasonId") REFERENCES "PlayerSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterSlot" ADD CONSTRAINT "RosterSlot_wrestlerId_fkey" FOREIGN KEY ("wrestlerId") REFERENCES "Wrestler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_wrestlerId_fkey" FOREIGN KEY ("wrestlerId") REFERENCES "Wrestler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointRule" ADD CONSTRAINT "PointRule_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPoint" ADD CONSTRAINT "PlayerPoint_playerSeasonId_fkey" FOREIGN KEY ("playerSeasonId") REFERENCES "PlayerSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaiverMove" ADD CONSTRAINT "WaiverMove_playerSeasonId_fkey" FOREIGN KEY ("playerSeasonId") REFERENCES "PlayerSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
