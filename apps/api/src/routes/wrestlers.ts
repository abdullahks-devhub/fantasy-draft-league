import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function wrestlerRoutes(fastify: FastifyInstance) {
  /**
   * GET /wrestlers
   * Returns all wrestlers, searchable and filterable.
   */
  fastify.get<{ Querystring: { search?: string; promotion?: string; active?: string } }>('/', async (request, reply) => {
    const { search, promotion, active } = request.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { aliases: { some: { alias: { contains: search, mode: 'insensitive' } } } }
      ];
    }
    if (promotion) where.currentTeam = promotion;
    if (active !== undefined) where.active = active === 'true';

    const wrestlers = await prisma.wrestler.findMany({
      where,
      include: {
        aliases: true,
        championships: true
      },
      orderBy: { name: 'asc' }
    });

    return { wrestlers };
  });

  /**
   * GET /wrestlers/:id
   * Get single wrestler details with history.
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const wrestler = await prisma.wrestler.findUnique({
      where: { id },
      include: {
        aliases: true,
        championships: true,
        matchInvolvements: {
          include: {
            match: {
              include: { show: true }
            }
          },
          orderBy: { match: { show: { date: 'desc' } } },
          take: 50
        }
      }
    });

    if (!wrestler) return reply.code(404).send({ error: 'Wrestler not found' });
    return { wrestler };
  });

  /**
   * PUT /wrestlers/:id
   * Update wrestler (active status, team, name).
   */
  fastify.put<{ Params: { id: string }; Body: { name?: string; currentTeam?: string; active?: boolean } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, currentTeam, active } = request.body;

    const updated = await prisma.wrestler.update({
      where: { id },
      data: { name, currentTeam, active }
    });

    return { success: true, wrestler: updated };
  });

  /**
   * POST /wrestlers/:id/aliases
   * Add alias for a wrestler.
   */
  fastify.post<{ Params: { id: string }; Body: { alias: string } }>('/:id/aliases', async (request, reply) => {
    const { id } = request.params;
    const { alias } = request.body;

    const newAlias = await prisma.wrestlerAlias.create({
      data: { wrestlerId: id, alias }
    });

    return { success: true, alias: newAlias };
  });

  /**
   * DELETE /wrestlers/aliases/:id
   * Remove alias.
   */
  fastify.delete<{ Params: { id: string } }>('/aliases/:id', async (request, reply) => {
    const { id } = request.params;
    await prisma.wrestlerAlias.delete({ where: { id } });
    return { success: true };
  });
}
