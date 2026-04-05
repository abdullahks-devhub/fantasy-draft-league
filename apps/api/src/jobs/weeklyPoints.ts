import { PointCalculationService } from '../services/pointCalculation';
import prisma from '../lib/db';

export async function runWeeklyPoints(weekNumber: number) {
  try {
    console.log(`[${new Date().toISOString()}] Starting weekly point generation for Week ${weekNumber}...`);
    
    // Get past 7 days matches
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const matches = await prisma.match.findMany({
      where: {
        show: {
          date: { gte: sevenDaysAgo }
        }
      },
      include: {
        participants: true,
        show: true
      }
    });

    const activePlayerSeasons = await prisma.playerSeason.findMany();
    const pointService = new PointCalculationService();

    for (const ps of activePlayerSeasons) {
      await pointService.calculatePlayerPoints(ps.id, weekNumber, matches as any);
    }

    // 4. GENERATE SNAPSHOT (Standings at end of this week)
    console.log(`[${new Date().toISOString()}] Calculating cumulative standings for snapshot...`);
    
    const seasonResults = [];
    for (const ps of activePlayerSeasons) {
      const allPoints = await prisma.playerPoint.findMany({
        where: { playerSeasonId: ps.id, weekNumber: { lte: weekNumber } }
      });
      const totalPoints = allPoints.reduce((sum, p) => sum + p.points, 0);
      seasonResults.push({ playerSeasonId: ps.id, totalPoints });
    }

    // Sort by points desc to get rank
    seasonResults.sort((a, b) => b.totalPoints - a.totalPoints);

    for (let i = 0; i < seasonResults.length; i++) {
      const res = seasonResults[i];
      await prisma.weeklyStanding.upsert({
        where: {
          playerSeasonId_weekNumber: {
            playerSeasonId: res.playerSeasonId,
            weekNumber
          }
        },
        update: {
          totalPoints: res.totalPoints,
          rank: i + 1
        },
        create: {
          playerSeasonId: res.playerSeasonId,
          weekNumber,
          totalPoints: res.totalPoints,
          rank: i + 1
        }
      });
    }
    
    console.log(`[${new Date().toISOString()}] Generated points for ${activePlayerSeasons.length} players.`);
  } catch (err) {
    console.error('Weekly Point Job Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// BullMQ equivalent:
// queue.add('pointsCalc', { weekNumber: currentWeek }, { repeat: { cron: '59 23 * * 6' } });
