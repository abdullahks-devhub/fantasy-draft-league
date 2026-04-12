import { PrismaClient } from '@prisma/client';
import { PointCalculationService } from './src/services/pointCalculation';

const prisma = new PrismaClient();
const pointCalc = new PointCalculationService();

async function run() {
  console.log('Fetching active season...');
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error('No active season');

  const manualWrestlers = await prisma.wrestler.findMany({
    where: { cagematchId: { startsWith: 'manual-' } }
  });

  const playerSeasons = await prisma.playerSeason.findMany({
    where: { seasonId: season.id },
    include: { rosterSlots: true }
  });

  if (manualWrestlers.length === 0 || playerSeasons.length === 0) {
      console.log('No manual wrestlers found or players found.');
      return;
  }

  let wIndex = 0;
  for (const w of manualWrestlers) {
    const ps = playerSeasons[wIndex % playerSeasons.length];
    const hasWrestler = await prisma.rosterSlot.findFirst({
        where: { playerSeasonId: ps.id, wrestlers: { some: { id: w.id } } }
    });
    if (!hasWrestler) {
        await prisma.rosterSlot.create({
            data: {
                playerSeasonId: ps.id,
                status: 'ACTIVE',
                wrestlers: { connect: { id: w.id } }
            }
        });
    }
    wIndex++;
  }

  console.log('Wrestlers successfully assigned to players.');

  const lastShow = await prisma.show.findFirst({ orderBy: { date: 'desc' }, where: { date: { gte: season.startDate } } });
  if (!lastShow) return;

  const currentWeek = Math.max(1, Math.ceil(((lastShow.date.getTime() - season.startDate.getTime()) / 86400000) / 7));

  for (let week = 1; week <= currentWeek; week++) {
      const weekStart = new Date(season.startDate.getTime() + (week - 1) * 7 * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

      const shows = await prisma.show.findMany({
          where: { date: { gte: weekStart, lt: weekEnd } },
          include: { matches: { include: { participants: true, show: true } } }
      });

      if (shows.length === 0) continue;

      const relevantMatches = shows.flatMap(s => s.matches);
      
      for (const ps of playerSeasons) {
        await pointCalc.calculatePlayerPoints(ps.id, week, relevantMatches);
      }
      console.log('Computed points for week', week);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
