import prisma from '../lib/db';

export class AnalyticsService {
  /**
   * Retrieves the top trending wrestlers over the last 4 weeks.
   */
  async getHotWrestlers(seasonId: string) {
    // Determine the most recent week compiled
    const latestPoint = await prisma.playerPoint.findFirst({
      where: { playerSeason: { seasonId } },
      orderBy: { weekNumber: 'desc' }
    });

    if (!latestPoint) return [];

    const currentWeek = latestPoint.weekNumber;
    const startWeek = Math.max(1, currentWeek - 3);

    // Sum points for each wrestler over the last 4 weeks
    // This requires parsing the pointsBreakdown JSON
    const pointsData = await prisma.playerPoint.findMany({
      where: {
        playerSeason: { seasonId },
        weekNumber: { gte: startWeek, lte: currentWeek }
      }
    });

    const wrestlerPoints = new Map<string, number>();

    for (const record of pointsData) {
      if (record.pointsBreakdown && Array.isArray(record.pointsBreakdown)) {
        for (const breakdownRaw of record.pointsBreakdown) {
          const breakdown = breakdownRaw as any;
          if (breakdown.wrestlers && Array.isArray(breakdown.wrestlers)) {
            for (const wId of breakdown.wrestlers) {
              const current = wrestlerPoints.get(wId) || 0;
              wrestlerPoints.set(wId, current + breakdown.points);
            }
          }
        }
      }
    }

    // Sort descending
    const sorted = Array.from(wrestlerPoints.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    // Inflate with wrestler details
    const wrestlers = await prisma.wrestler.findMany({
      where: { id: { in: sorted.map(s => s[0]) } }
    });

    return sorted.map(([id, points]) => {
      const w = wrestlers.find(w => w.id === id);
      return {
        id,
        name: w?.name,
        promotion: w?.currentTeam,
        trendPoints: points
      };
    });
  }

  /**
   * Returns top performing wrestlers not currently drafted by any player.
   */
  async getFreeAgents(seasonId: string) {
    const allDrafted = await prisma.rosterSlot.findMany({
      where: { playerSeason: { seasonId } },
      select: { wrestlers: { select: { id: true } } }
    });

    const draftedIds = allDrafted.flatMap(s => s.wrestlers.map(w => w.id));

    const activeFreeAgents = await prisma.wrestler.findMany({
      where: { 
        id: { notIn: draftedIds },
        active: true
      },
      take: 20
    });

    return activeFreeAgents;
  }
}
