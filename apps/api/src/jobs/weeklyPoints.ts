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
    
    console.log(`[${new Date().toISOString()}] Generated points for ${activePlayerSeasons.length} players.`);
  } catch (err) {
    console.error('Weekly Point Job Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// BullMQ equivalent:
// queue.add('pointsCalc', { weekNumber: currentWeek }, { repeat: { cron: '59 23 * * 6' } });
