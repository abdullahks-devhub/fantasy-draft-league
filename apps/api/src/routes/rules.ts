import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function ruleRoutes(fastify: FastifyInstance) {
  /**
   * GET /rules
   * Returns all point rules for the active season.
   */
  fastify.get<{ Querystring: { seasonId?: string } }>('/', async (request, reply) => {
    let { seasonId } = request.query;

    if (!seasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (activeSeason) seasonId = activeSeason.id;
    }

    if (!seasonId) return { rules: [] };

    const rules = await prisma.pointRule.findMany({
      where: { seasonId },
      orderBy: [
        { showType: 'asc' },
        { points: 'desc' }
      ]
    });

    return { rules };
  });

  /**
   * PUT /rules/:id
   * Update points for a rule. (Protected by Admin middleware in index.ts)
   */
  fastify.put<{ Params: { id: string }; Body: { points: number } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { points } = request.body;

    const updated = await prisma.pointRule.update({
      where: { id },
      data: { points }
    });

    return { success: true, rule: updated };
  });

  /**
   * POST /rules
   * Create a new point rule.
   */
  fastify.post<{ Body: { 
    seasonId?: string; 
    showType?: string; 
    matchType?: string; 
    result?: any; 
    points: number;
    isMainEvent?: boolean;
    isTournament?: boolean;
    isFinals?: boolean;
    isTitleMatch?: boolean;
    isWorldTitle?: boolean;
    isDefense?: boolean;
    tournamentName?: string;
  } }>('/', async (request, reply) => {
    let { seasonId, ...ruleData } = request.body;

    if (!seasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (!activeSeason) return reply.status(400).send({ error: 'No active season found' });
      seasonId = activeSeason.id;
    }

    const newRule = await prisma.pointRule.create({
      data: { 
        ...ruleData,
        seasonId,
      }
    });

    return { success: true, rule: newRule };
  });
}
