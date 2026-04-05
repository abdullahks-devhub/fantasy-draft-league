import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { setupWorkers } from './workers';
import { scraperQueue, pointsQueue } from './lib/queue';

dotenv.config();

const server: FastifyInstance = Fastify({
  logger: true
});

async function main() {
  await server.register(cors, {
    origin: '*', // Customize this for production
  });

  // Setup generic routing
  await server.register(setupRoutes, { prefix: '/api' });

  // Initialize background workers
  setupWorkers();

  // Schedule recurring jobs if in production or explicitly requested
  // Daily Scrape at 6 AM UTC
  await scraperQueue.add('daily-scrape', {}, { 
    repeat: { pattern: '0 6 * * *' },
    jobId: 'daily-scrape' 
  });

  // Weekly Points on Sunday 23:59 UTC
  await pointsQueue.add('weekly-points', { weekNumber: 1 }, { 
    repeat: { pattern: '59 23 * * 0' },
    jobId: 'weekly-points'
  });

  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server is dynamically bound to PORT ${port} for Railway!`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
