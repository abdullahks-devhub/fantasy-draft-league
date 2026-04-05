import { FastifyInstance } from 'fastify';

import { rosterRoutes } from './rosters';
import { waiverRoutes } from './waivers';
import { standingsRoutes } from './standings';
import { analyticsRoutes } from './analytics';
import { showsRoutes } from './shows';
import { tradesRoutes } from './trades';
import { wrestlerRoutes } from './wrestlers';
import { authRoutes } from './auth';
import { ruleRoutes } from './rules';
import { seasonRoutes } from './seasons';
import { adminRoutes } from './admin';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fantasy-key';

export async function setupRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.register(rosterRoutes, { prefix: '/rosters' });
  fastify.register(waiverRoutes, { prefix: '/waivers' });
  fastify.register(standingsRoutes, { prefix: '/standings' });
  fastify.register(analyticsRoutes, { prefix: '/analytics' });
  fastify.register(showsRoutes, { prefix: '/shows' });
  fastify.register(tradesRoutes, { prefix: '/trades' });
  fastify.register(wrestlerRoutes, { prefix: '/wrestlers' });
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(ruleRoutes, { prefix: '/rules' });
  fastify.register(seasonRoutes, { prefix: '/seasons' });
  fastify.register(adminRoutes, { prefix: '/admin' });

  // Simple Auth hook for admin/wrestler routes (could be a separate plugin)
  fastify.addHook('preHandler', async (request, reply) => {
    // Protect /admin routes and the write operations on /wrestlers, /rules
    const isAdminRoute = request.url.startsWith('/admin');
    const isWrestlerWrite = request.url.startsWith('/wrestlers') && ['POST', 'PUT', 'DELETE'].includes(request.method);
    const isRuleWrite = request.url.startsWith('/rules') && ['POST', 'PUT', 'DELETE'].includes(request.method);
    const isWaiverProcess = request.url.startsWith('/waivers/process');
    
    if (isAdminRoute || isWrestlerWrite || isRuleWrite || isWaiverProcess) {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'Unauthorized: No token provided' });
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') {
          return reply.code(403).send({ error: 'Forbidden: Admin role required' });
        }
        (request as any).user = decoded;
      } catch (e) {
        return reply.code(401).send({ error: 'Unauthorized: Invalid token' });
      }
    }
  });
}
