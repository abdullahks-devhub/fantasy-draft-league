import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function seasonRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    const seasons = await prisma.season.findMany({ orderBy: { startDate: 'desc' } });
    return { seasons };
  });

  /**
   * GET /seasons/active
   * Returns active season + all player entries (for dropdowns/modals).
   */
  fastify.get('/active', async (_request, reply) => {
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      include: {
        playerSeasons: {
          include: { user: { select: { id: true, email: true } } }
        }
      }
    });
    if (!activeSeason) return reply.code(404).send({ error: 'No active season found' });

    return {
      season: activeSeason,
      players: activeSeason.playerSeasons.map(ps => ({
        id: ps.id,
        userId: ps.userId,
        user: ps.user,
      }))
    };
  });

  /**
   * POST /seasons/lock-roster
   * Player selects up to 5 wrestlers to retain in the next season draft.
   */
  fastify.post<{ Body: { playerSeasonId: string; wrestlerIds: string[] } }>(
    '/lock-roster', async (request, reply) => {
      const { playerSeasonId, wrestlerIds } = request.body;
      if (!wrestlerIds || wrestlerIds.length > 5) {
        return reply.code(400).send({ error: 'You may lock a maximum of 5 wrestlers.' });
      }
      // Verify all wrestlers are actually on this roster
      const slots = await prisma.rosterSlot.findMany({
        where: { playerSeasonId },
        include: { wrestlers: { select: { id: true } } }
      });
      const ownedIds = slots.flatMap(s => s.wrestlers.map(w => w.id));
      const invalid = wrestlerIds.filter(id => !ownedIds.includes(id));
      if (invalid.length > 0) {
        return reply.code(400).send({ error: 'Some wrestlers are not on your roster.' });
      }
      await (prisma.playerSeason as any).update({
        where: { id: playerSeasonId },
        data: { lockedWrestlerIds: wrestlerIds }
      });
      return { success: true, lockedCount: wrestlerIds.length };
    }
  );

  /**
   * POST /seasons/archive
   * Admin: Archives the active season (marks COMPLETED) and freezes all rosters.
   */
  fastify.post('/archive', async (_request, reply) => {
    const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) return reply.code(404).send({ error: 'No active season found' });

    await prisma.season.update({
      where: { id: activeSeason.id },
      data: { isActive: false, status: 'COMPLETED', endDate: new Date() }
    });

    return { success: true, message: `Season "${activeSeason.name}" has been archived.` };
  });

  /**
   * POST /seasons/new
   * Admin: Creates a new active season, carrying over locked wrestlers.
   */
  fastify.post<{ Body: { 
    name: string; 
    startDate: string; 
    userIds: string[]; 
    honorLockedRosters: boolean 
  } }>('/new', async (request, reply) => {
    const { name, startDate, userIds, honorLockedRosters } = request.body;

    // Ensure no other season is active
    const existing = await prisma.season.findFirst({ where: { isActive: true } });
    if (existing) {
      return reply.code(400).send({ error: 'Archive the current active season before creating a new one.' });
    }

    const newSeason = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(new Date(startDate).getFullYear(), 11, 31),
        isActive: true,
        status: 'ACTIVE'
      }
    });

    // Create PlayerSeason entries for each user
    for (const userId of userIds) {
      const ps = await prisma.playerSeason.create({
        data: { userId, seasonId: newSeason.id }
      });

      // If honorLockedRosters is true, find the previous season's locked wrestlers and add them
      if (honorLockedRosters) {
        const prevPs = await (prisma.playerSeason as any).findFirst({
          where: { userId, seasonId: { not: newSeason.id } },
          orderBy: { createdAt: 'desc' }
        });
        const locked: string[] = (prevPs?.lockedWrestlerIds as string[]) || [];
        for (const wrestlerId of locked) {
          await prisma.rosterSlot.create({
            data: {
              playerSeasonId: ps.id,
              status: 'ACTIVE',
              wrestlers: { connect: { id: wrestlerId } }
            }
          });
        }
      }
    }

    return { success: true, season: newSeason };
  });

  /**
   * GET /seasons/history
   */
  fastify.get('/history', async (_request, reply) => {
    const historicalSeasons = await prisma.season.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { endDate: 'desc' },
      include: {
        winner: { select: { id: true, email: true } },
        playerSeasons: {
          include: {
            user: { select: { id: true, email: true } },
            playerPoints: true,
            rosterSlots: { include: { wrestlers: true } }
          }
        }
      }
    });

    const formattedHistory = historicalSeasons.map((season: any) => {
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
