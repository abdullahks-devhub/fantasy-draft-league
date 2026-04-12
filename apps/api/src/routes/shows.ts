import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function showsRoutes(fastify: FastifyInstance) {
  /**
   * GET /shows/weekly
   * Returns all shows scraped in a given ISO week, defaulting to the latest.
   */
  fastify.get<{ Querystring: { weekNumber?: string } }>('/weekly', async (request, reply) => {
    // 1. Fetch active season to ground our time math
    const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) return { shows: [], weekNumber: null };

    // Find the latest week if none provided
    let weekNumber: number | undefined = request.query.weekNumber
      ? parseInt(request.query.weekNumber, 10)
      : undefined;

    if (!weekNumber) {
      // Derive "week number" relative to the active season's start date
      const latest = await prisma.show.findFirst({ 
        where: { date: { gte: activeSeason.startDate } }, 
        orderBy: { date: 'desc' } 
      });
      const d = latest ? latest.date : new Date();
      // Calculate how many weeks have passed since the season started
      weekNumber = Math.max(1, Math.ceil(((d.getTime() - activeSeason.startDate.getTime()) / 86400000) / 7));
    }

    // Calculate date range starting from the season's start date
    const weekStart = new Date(activeSeason.startDate.getTime() + (weekNumber - 1) * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    // 2. Fetch all player rosters for this season to build the mapping (WrestlerId -> PlayerName)
    const playerSeasons = await prisma.playerSeason.findMany({
      where: { seasonId: activeSeason.id },
      include: { 
        user: { select: { email: true } },
        rosterSlots: {
          where: { status: 'ACTIVE' },
          include: { wrestlers: { select: { id: true } } }
        }
      }
    });

    const wrestlerOwnership: Record<string, string> = {};
    playerSeasons.forEach(ps => {
      const playerName = ps.user.email.split('@')[0]; // Use prefix as tag
      ps.rosterSlots.forEach(slot => {
        slot.wrestlers.forEach(w => {
          wrestlerOwnership[w.id] = playerName;
        });
      });
    });

    // 3. Fetch point breakdowns for this week to get the Codes
    const playerPoints = await prisma.playerPoint.findMany({
      where: { weekNumber }
    });

    // Map: WrestlerId + MatchId -> Array of Codes
    const pointCodesMap: Record<string, string[]> = {};
    playerPoints.forEach(pp => {
      const breakdown = (pp.pointsBreakdown as any[]) || [];
      breakdown.forEach(b => {
        const key = `${b.matchId}-${b.wrestlers[0]}`; // Simplified for primary
        if (!pointCodesMap[key]) pointCodesMap[key] = [];
        if (b.details) {
          b.details.forEach((d: any) => {
            if (d.code) pointCodesMap[key].push(d.code);
          });
        }
      });
    });

    // 4. Fetch the shows
    const shows = await prisma.show.findMany({
      where: {
        date: { gte: weekStart, lt: weekEnd }
      },
      include: {
        matches: {
          include: {
            participants: {
              include: { wrestler: true }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    const result = shows.map(show => ({
      showId: show.id,
      showName: show.name,
      date: show.date.toISOString(),
      promotion: show.promotion,
      showType: show.showType,
      matches: show.matches.map(m => {
        const winners = m.participants.filter(p => p.result === 'WIN');
        const losers = m.participants.filter(p => p.result === 'LOSS');
        const drawers = m.participants.filter(p => p.result === 'DRAW');

        const formatParticipant = (p: any) => {
          const owner = wrestlerOwnership[p.wrestlerId];
          const codes = pointCodesMap[`${m.id}-${p.wrestlerId}`] || [];
          return {
            id: p.wrestlerId,
            name: p.wrestler.name,
            owner: owner || null,
            codes: codes
          };
        };

        return {
          matchId: m.id,
          matchType: m.matchType,
          isMainEvent: m.isMainEvent,
          winners: winners.map(formatParticipant),
          losers: losers.map(formatParticipant),
          drawers: drawers.map(formatParticipant),
          resultType: m.participants[0]?.result // Generic result
        };
      })
    }));

    return { shows: result, weekNumber };
  });
}
