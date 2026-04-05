import prisma from '../lib/db';
import { subDays } from 'date-fns';

export class AnalyticsService {
  /**
   * Retrieves the top trending wrestlers (drafted) over the last 4 weeks.
   */
  async getHotWrestlers(seasonId: string) {
    const latestPoint = await prisma.playerPoint.findFirst({
      where: { playerSeason: { seasonId } },
      orderBy: { weekNumber: 'desc' }
    });

    if (!latestPoint) return [];

    const currentWeek = latestPoint.weekNumber;
    const startWeek = Math.max(1, currentWeek - 3);

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
              wrestlerPoints.set(wId, current + (breakdown.points || 0));
            }
          }
        }
      }
    }

    const sorted = Array.from(wrestlerPoints.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
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
   * Returns top performing wrestlers NOT currently drafted by any player,
   * who have wrestled a match in an 'Active Company' within the last 365 days.
   */
  async getFreeAgents(seasonId: string, limit = 20) {
    const yearAgo = subDays(new Date(), 365);

    // 1. Get all currently drafted wrestler IDs for this season
    const allDrafted = await prisma.rosterSlot.findMany({
      where: { playerSeason: { seasonId } },
      select: { wrestlers: { select: { id: true } } }
    });
    const draftedIds = allDrafted.flatMap(s => s.wrestlers.map(w => w.id));

    // 2. Find wrestlers NOT drafted and have matches in last year
    // Note: We define 'Active Company' simply as any wrestler who has a match record in our System.
    // (As per user: 'Every active promotion')
    const freeAgents = await prisma.wrestler.findMany({
      where: {
        id: { notIn: draftedIds },
        matchInvolvements: {
          some: {
            match: {
              show: {
                date: { gte: yearAgo }
              }
            }
          }
        }
      },
      take: limit,
      include: {
        matchInvolvements: {
          where: {
            match: { show: { date: { gte: yearAgo } } }
          },
          include: {
            match: {
              include: { show: true }
            }
          }
        }
      }
    });

    return freeAgents.map(w => ({
      id: w.id,
      name: w.name,
      promotion: w.currentTeam || 'Independent',
      lastMatch: w.matchInvolvements[0]?.match.show.date,
      matchCountYear: w.matchInvolvements.length
    }));
  }

  /**
   * Generates predictions for which free agents will do well based on:
   * 1. Recent match frequency (last 30 days)
   * 2. Historical points potential (estimated from match results)
   */
  async getFreeAgentPredictions(seasonId: string) {
    const monthAgo = subDays(new Date(), 30);
    const freeAgents = await this.getFreeAgents(seasonId, 50);
    
    // Load rules once to estimate potential
    const rules = await prisma.pointRule.findMany({ where: { seasonId } });

    const predictions = [];

    for (const fa of freeAgents) {
      // Re-fetch match involvements for last 30 days to be precise
      const involvements = await prisma.matchParticipant.findMany({
        where: {
          wrestlerId: fa.id,
          match: { show: { date: { gte: monthAgo } } }
        },
        include: {
          match: { include: { show: true } }
        }
      });

      let estimatedPoints = 0;
      for (const inv of involvements) {
        // Find best matching rule (simplified heuristic)
        const matchRule = rules.find(r => 
          r.showType === inv.match.show.showType && 
          r.result === inv.result
        ) || rules.find(r => r.result === inv.result);

        estimatedPoints += matchRule?.points || 2; // Default 2 for presence
      }

      const matchFrequency = involvements.length;
      const potentialScore = estimatedPoints * (matchFrequency / 2); // Multiplier for active wrestlers

      if (potentialScore > 0) {
        predictions.push({
          id: fa.id,
          name: fa.name,
          potentialScore: Math.round(potentialScore),
          estimatedAvg: involvements.length ? (estimatedPoints / involvements.length).toFixed(1) : 0,
          reason: `High activity (${matchFrequency} matches) with ${estimatedPoints} points potential in the last 30 days.`
        });
      }
    }

    return predictions.sort((a, b) => b.potentialScore - a.potentialScore).slice(0, 10);
  }
}
