import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

const MAX_ACTIVE = 10;
const MAX_BENCH = 5;
const MAX_TOTAL_BASE = 15;
const MAX_IR = 2;

export async function rosterRoutes(fastify: FastifyInstance) {
  /**
   * GET /rosters/:playerSeasonId
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
   * PATCH /rosters/:slotId/status
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

      // Enforce limits
      const stats = await prisma.rosterSlot.findMany({
        where: { playerSeasonId: slot.playerSeasonId }
      });

      const activeCount = stats.filter(s => s.status === 'ACTIVE' && s.id !== slotId).length;
      const benchCount  = stats.filter(s => s.status === 'BENCH' && s.id !== slotId).length;
      const irCount     = stats.filter(s => s.status === 'IR'    && s.id !== slotId).length;

      if (status === 'ACTIVE') {
        if (activeCount >= MAX_ACTIVE) return reply.code(400).send({ error: `Limit reached: ${MAX_ACTIVE} Active spots maximal.` });
        if (activeCount + benchCount >= MAX_TOTAL_BASE) return reply.code(400).send({ error: `Limit reached: ${MAX_TOTAL_BASE} total roster spots (Active + Bench). Drop someone first.` });
      }

      if (status === 'BENCH') {
        if (benchCount >= MAX_BENCH) return reply.code(400).send({ error: `Limit reached: ${MAX_BENCH} Bench spots maximal.` });
        if (activeCount + benchCount >= MAX_TOTAL_BASE) return reply.code(400).send({ error: `Limit reached: ${MAX_TOTAL_BASE} total roster spots (Active + Bench). Drop someone first.` });
      }

      if (status === 'IR') {
        if (irCount >= MAX_IR) return reply.code(400).send({ error: `Limit reached: ${MAX_IR} IR spots maximal.` });
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
   */
  fastify.post<{ Body: { playerSeasonId: string; wrestlerId: string; status?: 'ACTIVE' | 'BENCH' | 'IR' } }>(
    '/add', async (request, reply) => {
      const { playerSeasonId, wrestlerId, status = 'ACTIVE' } = request.body;

      const existing = await prisma.rosterSlot.findFirst({
        where: { playerSeasonId, wrestlers: { some: { id: wrestlerId } } }
      });
      if (existing) return reply.code(400).send({ error: 'Wrestler already on roster' });

      const stats = await prisma.rosterSlot.findMany({ where: { playerSeasonId } });
      const activeCount = stats.filter(s => s.status === 'ACTIVE').length;
      const benchCount  = stats.filter(s => s.status === 'BENCH').length;
      const irCount     = stats.filter(s => s.status === 'IR').length;

      if (status === 'ACTIVE') {
        if (activeCount >= MAX_ACTIVE) return reply.code(400).send({ error: `Limit reached: ${MAX_ACTIVE} Active spots.` });
        if (activeCount + benchCount >= MAX_TOTAL_BASE) return reply.code(400).send({ error: `Base roster limit reached (15). Add to IR or drop someone.` });
      }
      if (status === 'BENCH') {
        if (benchCount >= MAX_BENCH) return reply.code(400).send({ error: `Limit reached: ${MAX_BENCH} Bench spots.` });
        if (activeCount + benchCount >= MAX_TOTAL_BASE) return reply.code(400).send({ error: `Base roster limit reached (15). Add to IR or drop someone.` });
      }
      if (status === 'IR') {
        if (irCount >= MAX_IR) return reply.code(400).send({ error: `Limit reached: ${MAX_IR} IR spots.` });
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
