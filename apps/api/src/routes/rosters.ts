import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

const MAX_ACTIVE = 10;

export async function rosterRoutes(fastify: FastifyInstance) {
  /**
   * GET /rosters/:playerSeasonId
   * Returns all slots (Active, Bench, IR) for a player.
   */
  fastify.get<{ Params: { playerSeasonId: string } }>('/:playerSeasonId', async (request, reply) => {
    const { playerSeasonId } = request.params;
    const roster = await prisma.rosterSlot.findMany({
      where: { playerSeasonId },
      include: { wrestlers: true },
      orderBy: { status: 'asc' }
    });
    return { roster };
  });

  /**
   * PATCH /rosters/:slotId/status   (Admin-only)
   * Toggle a slot between ACTIVE, BENCH, IR.
   * Enforces 10-active limit when activating.
   */
  fastify.patch<{ Params: { slotId: string }; Body: { status: 'ACTIVE' | 'BENCH' | 'IR' } }>(
    '/:slotId/status', async (request, reply) => {
      const { slotId } = request.params;
      const { status } = request.body;

      const slot = await prisma.rosterSlot.findUnique({
        where: { id: slotId },
        include: { wrestlers: true }
      });
      if (!slot) return reply.code(404).send({ error: 'Slot not found' });

      // Enforce active limit when promoting to ACTIVE
      if (status === 'ACTIVE') {
        const activeCount = await prisma.rosterSlot.count({
          where: { playerSeasonId: slot.playerSeasonId, status: 'ACTIVE' }
        });
        if (activeCount >= MAX_ACTIVE) {
          return reply.code(400).send({
            error: `Roster already has ${MAX_ACTIVE} active wrestlers. Move one to Bench or IR first.`
          });
        }
      }

      const updated = await prisma.rosterSlot.update({
        where: { id: slotId },
        data: { status },
        include: { wrestlers: true }
      });

      return { success: true, slot: updated };
    }
  );

  /**
   * POST /rosters/add
   * Adds a wrestler. Enforces 10-active limit.
   */
  fastify.post<{ Body: { playerSeasonId: string; wrestlerId: string; status?: 'ACTIVE' | 'BENCH' | 'IR' } }>(
    '/add', async (request, reply) => {
      const { playerSeasonId, wrestlerId, status = 'ACTIVE' } = request.body;

      const existing = await prisma.rosterSlot.findFirst({
        where: { playerSeasonId, wrestlers: { some: { id: wrestlerId } } }
      });
      if (existing) return reply.code(400).send({ error: 'Wrestler already on roster' });

      if (status === 'ACTIVE') {
        const activeCount = await prisma.rosterSlot.count({
          where: { playerSeasonId, status: 'ACTIVE' }
        });
        if (activeCount >= MAX_ACTIVE) {
          return reply.code(400).send({
            error: `Roster already has ${MAX_ACTIVE} active wrestlers. Add to Bench or IR instead.`
          });
        }
      }

      const slot = await prisma.rosterSlot.create({
        data: { playerSeasonId, wrestlers: { connect: [{ id: wrestlerId }] }, status }
      });
      return { success: true, slot };
    }
  );

  /**
   * POST /rosters/drop
   */
  fastify.post<{ Body: { playerSeasonId: string; wrestlerId: string } }>(
    '/drop', async (request, reply) => {
      const { playerSeasonId, wrestlerId } = request.body;
      await prisma.rosterSlot.deleteMany({
        where: { playerSeasonId, wrestlers: { some: { id: wrestlerId } } }
      });
      return { success: true };
    }
  );

  /**
   * POST /rosters/trade
   */
  fastify.post<{ Body: { fromPlayerSeasonId: string; toPlayerSeasonId: string; wrestlerOutId: string; wrestlerInId: string } }>(
    '/trade', async (request, reply) => {
      const { fromPlayerSeasonId, toPlayerSeasonId, wrestlerOutId, wrestlerInId } = request.body;
      await prisma.$transaction([
        prisma.rosterSlot.deleteMany({ where: { playerSeasonId: fromPlayerSeasonId, wrestlers: { some: { id: wrestlerOutId } } } }),
        prisma.rosterSlot.deleteMany({ where: { playerSeasonId: toPlayerSeasonId, wrestlers: { some: { id: wrestlerInId } } } }),
        prisma.rosterSlot.create({ data: { playerSeasonId: fromPlayerSeasonId, wrestlers: { connect: [{ id: wrestlerInId }] }, status: 'ACTIVE' } }),
        prisma.rosterSlot.create({ data: { playerSeasonId: toPlayerSeasonId, wrestlers: { connect: [{ id: wrestlerOutId }] }, status: 'ACTIVE' } }),
        prisma.trade.create({ data: { data: { fromPlayerSeasonId, toPlayerSeasonId, wrestlerOutId, wrestlerInId } } })
      ]);
      return { success: true };
    }
  );
}
