import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue';
import { runDailyScrape } from '../jobs/cagematchScraper';
import { runWeeklyPoints } from '../jobs/weeklyPoints';
import { archiveExpiredSeasons } from '../jobs/seasonArchive';
import prisma from '../lib/db';

export function setupWorkers() {
  console.log('[Worker] Initializing background workers...');

  // 1. Scraper Worker
  const scraperWorker = new Worker('scraper-queue', async (job: Job) => {
    console.log(`[Worker] Executing scraper job: ${job.id}`);
    await runDailyScrape();
  }, { connection });

  // 2. Points Calculation Worker
  const pointsWorker = new Worker('points-queue', async (job: Job) => {
    const { weekNumber } = job.data;
    console.log(`[Worker] Executing points calculation job for week ${weekNumber}`);
    await runWeeklyPoints(weekNumber);
  }, { connection });

  // 3. Season Archival Worker
  const seasonWorker = new Worker('season-queue', async (job: Job) => {
    console.log('[Worker] Checking for expired seasons...');
    await archiveExpiredSeasons();
  }, { connection });

  scraperWorker.on('error', err => console.error('[Worker Error] Scraper:', err));
  pointsWorker.on('error', err => console.error('[Worker Error] Points:', err));
  seasonWorker.on('error', err => console.error('[Worker Error] Season:', err));
}
