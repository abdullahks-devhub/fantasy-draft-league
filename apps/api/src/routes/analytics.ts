import { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../services/analytics';
import prisma from '../lib/db';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const analyticsService = new AnalyticsService();

  fastify.get<{ Querystring: { seasonId?: string } }>('/hot', async (request, reply) => {
    let { seasonId } = request.query;

    if (!seasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (activeSeason) seasonId = activeSeason.id;
    }

    if (!seasonId) {
      return { hotWrestlers: [] };
    }

    const hotWrestlers = await analyticsService.getHotWrestlers(seasonId);
    return { hotWrestlers };
  });

  fastify.get<{ Querystring: { seasonId?: string } }>('/predictions', async (request, reply) => {
    let { seasonId } = request.query;

    if (!seasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (activeSeason) seasonId = activeSeason.id;
    }

    if (!seasonId) return { predictions: [] };

    const predictions = await analyticsService.getFreeAgentPredictions(seasonId);
    return { predictions };
  });

  fastify.get<{ Querystring: { seasonId?: string } }>('/free-agents', async (request, reply) => {
    let { seasonId } = request.query;

    if (!seasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (activeSeason) seasonId = activeSeason.id;
    }

    if (!seasonId) return { freeAgents: [] };

    const freeAgents = await analyticsService.getFreeAgents(seasonId, 20);
    return { freeAgents };
  });
}
