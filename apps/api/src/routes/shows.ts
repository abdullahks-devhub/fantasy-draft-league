import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function showsRoutes(fastify: FastifyInstance) {
  /**
   * GET /shows/weekly
   * Returns all shows scraped in a given ISO week, defaulting to the latest.
   */
  fastify.get<{ Querystring: { weekNumber?: string } }>('/weekly', async (request, reply) => {
    // Find the latest week if none provided
    let weekNumber: number | undefined = request.query.weekNumber
      ? parseInt(request.query.weekNumber, 10)
      : undefined;

    if (!weekNumber) {
      // Derive "week number" from the most recent show date
      const latest = await prisma.show.findFirst({ orderBy: { date: 'desc' } });
      if (!latest) return { shows: [], weekNumber: null };
      const d = latest.date;
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      // Week number calculation (ISO-ish)
      weekNumber = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    }

    // Calculate date range for that ISO week
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekStart = new Date(yearStart.getTime() + (weekNumber - 1) * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    // 1. Fetch active season to get correct players
    const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) return { shows: [], weekNumber: null };

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
