import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function rosterRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { playerSeasonId: string } }>('/:playerSeasonId', async (request, reply) => {
    const { playerSeasonId } = request.params;
    
    const roster = await prisma.rosterSlot.findMany({
      where: { playerSeasonId },
      include: {
        wrestlers: true
      }
    });
    
    return { roster };
  });

  fastify.post<{ Body: { playerSeasonId: string, wrestlerId: string } }>('/add', async (request, reply) => {
    const { playerSeasonId, wrestlerId } = request.body;
    
    // Check constraints (e.g. max 15) here in real app
    
    const slot = await prisma.rosterSlot.create({
      data: { playerSeasonId, wrestlers: { connect: [{ id: wrestlerId }] }, status: 'ACTIVE' }
    });
    
    return { success: true, slot };
  });

  fastify.post<{ Body: { playerSeasonId: string, wrestlerId: string } }>('/drop', async (request, reply) => {
    const { playerSeasonId, wrestlerId } = request.body;
    
    await prisma.rosterSlot.deleteMany({
      where: {
        playerSeasonId,
        wrestlers: { some: { id: wrestlerId } }
      }
    });
    
    return { success: true };
  });

  fastify.post<{ Body: { fromPlayerSeasonId: string, toPlayerSeasonId: string, wrestlerOutId: string, wrestlerInId: string } }>('/trade', async (request, reply) => {
    const { fromPlayerSeasonId, toPlayerSeasonId, wrestlerOutId, wrestlerInId } = request.body;
    
    // Transaction to safely swap wrestlers
    await prisma.$transaction([
      prisma.rosterSlot.deleteMany({
        where: { playerSeasonId: fromPlayerSeasonId, wrestlers: { some: { id: wrestlerOutId } } }
      }),
      prisma.rosterSlot.deleteMany({
        where: { playerSeasonId: toPlayerSeasonId, wrestlers: { some: { id: wrestlerInId } } }
      }),
      prisma.rosterSlot.create({
        data: { playerSeasonId: fromPlayerSeasonId, wrestlers: { connect: [{ id: wrestlerInId }] }, status: 'ACTIVE' }
      }),
      prisma.rosterSlot.create({
        data: { playerSeasonId: toPlayerSeasonId, wrestlers: { connect: [{ id: wrestlerOutId }] }, status: 'ACTIVE' }
      }),
      prisma.trade.create({
        data: {
          data: {
            fromPlayerSeasonId, toPlayerSeasonId, wrestlerOutId, wrestlerInId
          }
        }
      })
    ]);
    
    return { success: true };
  });
}
