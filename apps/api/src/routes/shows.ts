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
      weekNumber = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    }

    // Calculate date range for that ISO week
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekStart = new Date(yearStart.getTime() + (weekNumber - 1) * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

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
      matches: show.matches.map(m => ({
        matchId: m.id,
        matchType: m.matchType,
        isMainEvent: m.isMainEvent,
        participants: m.participants.map(p => ({
          wrestlerName: p.wrestler.name,
          wrestlerId: p.wrestlerId,
          result: p.result,
        }))
      }))
    }));

    return { shows: result, weekNumber };
  });
}
