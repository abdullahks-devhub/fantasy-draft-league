import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';
import { WaiverService } from '../services/waiver';

export async function waiverRoutes(fastify: FastifyInstance) {
  const waiverService = new WaiverService();

  fastify.get<{ Querystring: { seasonId?: string } }>('/pending', async (request, reply) => {
    let { seasonId } = request.query;

    if (!seasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (activeSeason) seasonId = activeSeason.id;
    }

    if (!seasonId) return { pending: [] };

    const rawPending = await prisma.waiverMove.findMany({
      where: {
        playerSeason: { seasonId },
        status: 'PENDING'
      },
      include: {
        playerSeason: {
          include: { 
            user: true,
            playerPoints: {
               select: { points: true }
            }
          }
        },
        wrestler: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const pending = rawPending.map((p: any) => {
      const totalPoints = p.playerSeason.playerPoints.reduce((sum: number, pp: any) => sum + pp.points, 0);
      return {
        ...p,
        playerSeason: {
          ...p.playerSeason,
          totalPoints
        }
      };
    });

    return { pending };
  });


  fastify.post<{ Body: { seasonId: string } }>('/process', async (request, reply) => {
    const { seasonId } = request.body;
    
    try {
      const result = await waiverService.processWeeklyWaivers(seasonId);
      return { success: true, result };
    } catch (e: any) {
      return reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.post<{ Body: { playerSeasonId: string, wrestlerId: string, action: 'ADD' | 'DROP', priority: number } }>('/submit', async (request, reply) => {
    const { playerSeasonId, wrestlerId, action, priority } = request.body;

    const move = await prisma.waiverMove.create({
      data: {
        playerSeasonId,
        wrestlerId,
        action,
        priority,
        status: 'PENDING'
      }
    });

    return { success: true, move };
  });
}
