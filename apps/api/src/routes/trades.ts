import { FastifyInstance } from 'fastify';
import prisma from '../lib/db';

export async function tradesRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    const trades = await prisma.trade.findMany({
      orderBy: { executedAt: 'desc' }
    });
    return { trades };
  });
}
