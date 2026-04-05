import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function seasonRoutes(fastify: FastifyInstance) {
  /**
   * GET /seasons
   * Returns all seasons (active and historical).
   */
  fastify.get('/', async (_request, reply) => {
    const seasons = await prisma.season.findMany({
      orderBy: { startDate: 'desc' }
    });
    return { seasons };
  });

  /**
   * GET /seasons/active
   * Get the current active season.
   */
  fastify.get('/active', async (_request, reply) => {
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true }
    });
    if (!activeSeason) return reply.code(404).send({ error: 'No active season found' });
    return { season: activeSeason };
  });

  /**
   * GET /seasons/history
   * Retrieves past seasons (COMPLETED), their winners, and final rosters.
   */
  fastify.get('/history', async (_request, reply) => {
    const historicalSeasons = await prisma.season.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      include: {
        winner: {
          select: { id: true, email: true }
        },
        playerSeasons: {
          include: {
            user: { select: { id: true, email: true } },
            playerPoints: true, // Used to aggregate the final scores
            rosterSlots: {
              include: { wrestlers: true }
            }
          }
        }
      }
    });

    const formattedHistory = historicalSeasons.map((season: any) => {
      // Map player standtings and final rosters for the season
      const standings = season.playerSeasons.map((ps: any) => {
        const totalPoints = ps.playerPoints.reduce((sum: number, p: any) => sum + p.points, 0);
        return {
          playerId: ps.userId,
          playerName: ps.user.email.split('@')[0],
          totalPoints,
          roster: ps.rosterSlots.map((slot: any) => ({
            id: slot.id,
            status: slot.status,
            wrestlers: slot.wrestlers.map((w: any) => w.name)
          }))
        };
      });

      // Sort by points descending
      standings.sort((a: any, b: any) => b.totalPoints - a.totalPoints);

      return {
        id: season.id,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        winner: season.winner ? season.winner.email.split('@')[0] : (standings[0]?.playerName || null),
        standings
      };
    });

    return { history: formattedHistory };
  });
}
