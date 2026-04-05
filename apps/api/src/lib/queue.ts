import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Define our queues
export const scraperQueue = new Queue('scraper-queue', { connection });
export const pointsQueue = new Queue('points-queue', { connection });
export const seasonQueue = new Queue('season-queue', { connection });

// Optional: Event listeners for global logging
const scraperEvents = new QueueEvents('scraper-queue', { connection });
scraperEvents.on('completed', ({ jobId }) => {
  console.log(`[Queue] Scraper job ${jobId} completed`);
});
scraperEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[Queue] Scraper job ${jobId} failed: ${failedReason}`);
});
