import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function standingsRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { seasonId?: string } }>('/', async (request, reply) => {
    const { seasonId } = request.query;

    // In a real app we'd filter by active season if none provided
    const seasonFilter = seasonId ? { id: seasonId } : { isActive: true };

    const season = await prisma.season.findFirst({
      where: seasonFilter,
      include: {
        playerSeasons: {
          include: {
            user: true,
            playerPoints: true,
            rosterSlots: true
          }
        }
      }
    });

    if (!season) {
      return { standings: [] };
    }

    const standings = season.playerSeasons.map(ps => {
      const totalPoints = ps.playerPoints.reduce((acc, pt) => acc + pt.points, 0);
      
      // Calculate a basic trend based on the difference between the last two weeks
      let trend = 'stable';
      if (ps.playerPoints.length >= 2) {
        const sortedPoints = [...ps.playerPoints].sort((a, b) => b.weekNumber - a.weekNumber);
        const lastWeek = sortedPoints[0].points;
        const prevWeek = sortedPoints[1].points;
        if (lastWeek > prevWeek) trend = 'up';
        else if (lastWeek < prevWeek) trend = 'down';
      }

      return {
        playerSeasonId: ps.id,
        name: ps.user.email.split('@')[0], // Basic placeholder for a username/name
        points: totalPoints,
        trend,
        rosterSize: ps.rosterSlots.length
      };
    });

    // Sort by points descending
    standings.sort((a, b) => b.points - a.points);

    // Assign ranks
    const rankedStandings = standings.map((s, idx) => ({
      ...s,
      rank: idx + 1
    }));

    return { standings: rankedStandings };
  });

  fastify.get<{ Querystring: { seasonId?: string } }>('/history', async (request, reply) => {
    const { seasonId } = request.query;
    const seasonFilter = seasonId ? { id: seasonId } : { isActive: true };

    const season = await prisma.season.findFirst({ where: seasonFilter });
    if (!season) return { history: [] };

    const history = await prisma.weeklyStanding.findMany({
      where: { playerSeason: { seasonId: season.id } },
      include: { playerSeason: { include: { user: true } } },
      orderBy: [{ weekNumber: 'asc' }, { rank: 'asc' }]
    });

    return { history };
  });

  fastify.get<{ Params: { weekNumber: string }, Querystring: { seasonId?: string } }>('/weekly/:weekNumber', async (request, reply) => {
    const { weekNumber } = request.params;
    const { seasonId } = request.query;
    const seasonFilter = seasonId ? { id: seasonId } : { isActive: true };

    const season = await prisma.season.findFirst({ where: seasonFilter });
    if (!season) return { standings: [] };

    const standings = await prisma.weeklyStanding.findMany({
      where: {
        weekNumber: parseInt(weekNumber, 10),
        playerSeason: { seasonId: season.id }
      },
      include: { playerSeason: { include: { user: true } } },
      orderBy: { rank: 'asc' }
    });

    return { standings };
  });
}
