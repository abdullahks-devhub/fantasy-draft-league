import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Generating Standings Snapshot for Week 1...');
  const season = await prisma.season.findFirst({ where: { name: 'Season 4' } });
  if (!season) throw new Error('No Season 4 found');

  const playerSeasons = await prisma.playerSeason.findMany({
    where: { seasonId: season.id }
  });

  const results: any[] = [];
  for (const ps of playerSeasons) {
    const points = await prisma.playerPoint.findMany({
      where: { playerSeasonId: ps.id, weekNumber: { lte: 1 } }
    });
    const total = points.reduce((s, p) => s + p.points, 0);
    results.push({ id: ps.id, total });
  }

  results.sort((a, b) => b.total - a.total);

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    await prisma.weeklyStanding.upsert({
      where: {
        playerSeasonId_weekNumber: {
          playerSeasonId: res.id,
          weekNumber: 1
        }
      },
      update: {
        totalPoints: res.total,
        rank: i + 1
      },
      create: {
        playerSeasonId: res.id,
        weekNumber: 1,
        totalPoints: res.total,
        rank: i + 1
      }
    });
  }
  console.log('✅ Snapshot 1 complete!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
