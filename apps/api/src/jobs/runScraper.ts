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

    // 3. Find all matches for the current active season
    console.log(`Calculating points for all shows in the active season...`);

    const dbShows = await prisma.show.findMany({
        where: { date: { gte: activeSeason.startDate } },
        include: { matches: { include: { participants: true, show: true } } }
    });

    if (dbShows.length === 0) {
        console.log('No shows found in database for this season. Scraper may have failed or filtered them out.');
        return;
    }

    // Iterate through weeks to ensure point recalculation is thorough
    const latestDate = Math.max(...dbShows.map(s => s.date.getTime()));
    const totalWeeks = Math.ceil(((latestDate - activeSeason.startDate.getTime()) / 86400000) / 7);

    for (let week = 1; week <= totalWeeks; week++) {
        const weekStart = new Date(activeSeason.startDate.getTime() + (week - 1) * 7 * 86400000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

        const currentWeekMatches = dbShows
            .filter(s => s.date >= weekStart && s.date < weekEnd)
            .flatMap(s => s.matches);

        if (currentWeekMatches.length === 0) continue;

        console.log(`Recalculating Week ${week} (${currentWeekMatches.length} matches)...`);
        for (const ps of playerSeasons) {
            await pointCalcService.calculatePlayerPoints(ps.id, week, currentWeekMatches);
        }
    }

    console.log(`Successfully recalculated points for the active season.`);
  } catch (err) {
    console.error('Fatal error during scrape:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
