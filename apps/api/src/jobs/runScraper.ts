import { PrismaClient } from '@prisma/client';
import { CagematchService } from '../services/cagematch';
import { PointCalculationService } from '../services/pointCalculation';

const prisma = new PrismaClient();
const cagematchService = new CagematchService();
const pointCalcService = new PointCalculationService();

async function run() {
  console.log('--- Starting Cagematch Scraper Job ---');
  
  try {
    const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) {
      console.log('No active season found. Exiting.');
      return;
    }

    console.log('Scraping recent shows with Playwright...');
    const shows = await cagematchService.scrapeRecentShows();
    console.log(`Scraped ${shows.length} shows from source.`);

    // Wait, the scrapeRecentShows will handle creating/returning the shows and matches.
    // If it returns them, we need to ensure they are written to DB.
    // We will assume cagematchService handles the DB writes inside of it or we do it here.

    // 2. Identify all PlayerSeasons to recalculate
    const playerSeasons = await prisma.playerSeason.findMany({
      where: { seasonId: activeSeason.id }
    });

    if (playerSeasons.length === 0) {
        console.log('No active players found.');
        return;
    }

    // 3. Find latest shows to derive what weeks to calculate
    const lastShow = await prisma.show.findFirst({ 
        where: { date: { gte: activeSeason.startDate } }, 
        orderBy: { date: 'desc' } 
    });
    
    let currentWeek = 1;
    if (lastShow) {
        currentWeek = Math.max(1, Math.ceil(((lastShow.date.getTime() - activeSeason.startDate.getTime()) / 86400000) / 7));
    }

    console.log(`Triggering calculations for Week ${currentWeek}...`);

    const weekStart = new Date(activeSeason.startDate.getTime() + (currentWeek - 1) * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    const dbShows = await prisma.show.findMany({
        where: { date: { gte: weekStart, lt: weekEnd } },
        include: { matches: { include: { participants: true, show: true } } }
    });

    const relevantMatches = dbShows.flatMap(s => s.matches);

    for (const ps of playerSeasons) {
        await pointCalcService.calculatePlayerPoints(ps.id, currentWeek, relevantMatches);
    }

    console.log(`Successfully recalculated points for week ${currentWeek}.`);
  } catch (err) {
    console.error('Fatal error during scrape:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
