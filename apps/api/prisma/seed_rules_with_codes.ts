import { PrismaClient, Result } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error('No active season found');

  console.log(`Seeding rules with codes for season: ${season.name}`);

  const rules = [
    // TV Rules
    { showType: 'TV', matchType: 'Singles', result: Result.WIN, points: 1, code: 'TVSW' },
    { showType: 'TV', matchType: 'Tag Team', result: Result.WIN, points: 1, code: 'TVTW' },
    { showType: 'TV', matchType: 'Singles', result: Result.WIN, isMainEvent: true, points: 8, code: 'TVMEW' },
    { showType: 'TV', isMainEvent: true, points: 3, code: 'TVMEA' },
    
    // PPV Rules
    { showType: 'PPV', matchType: 'Singles', result: Result.WIN, points: 3, code: 'PPVSW' },
    { showType: 'PPV', matchType: 'Tag Team', result: Result.WIN, points: 5, code: 'PPVTW' },
    { showType: 'PPV', isMainEvent: true, points: 5, code: 'PPVMEA' },
    
    // Generic / Bonus
    { points: 5, code: 'TD' }, // Touchdown / High Impact
    { result: Result.DRAW, points: 5, code: 'TD' }, // Time Limit Draw
    { isTitleMatch: true, result: Result.WIN, points: 10, code: 'TW' }, // Title Win
  ];

  for (const r of rules) {
    await prisma.pointRule.create({
      data: {
        ...r,
        seasonId: season.id
      }
    });
  }

  console.log('✅ Rules seeded successfully.');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
