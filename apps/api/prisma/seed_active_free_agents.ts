import { PrismaClient, Result } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function run() {
  console.log('Seeding recent matches for current Free Agents...');
  
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error('No active season');

  // 1. Find all currently drafted wrestler IDs
  const allDrafted = await prisma.rosterSlot.findMany({
    where: { playerSeason: { seasonId: season.id } },
    select: { wrestlers: { select: { id: true } } }
  });
  const draftedIds = new Set(allDrafted.flatMap(s => s.wrestlers.map(w => w.id)));

  // 2. Find wrestlers NOT drafted to make into "Hot Free Agents"
  const freeAgents = await prisma.wrestler.findMany({
    where: { id: { notIn: Array.from(draftedIds) } },
    take: 15
  });

  console.log(`Found ${freeAgents.length} free agents to promote...`);

  const now = new Date();
  
  for (let i = 0; i < freeAgents.length; i++) {
    const fa = freeAgents[i];
    // Create a few recent matches for each
    for (let j = 0; j < 3; j++) {
      const date = subDays(now, j * 5 + i);
      const isWin = Math.random() > 0.4;
      
      const show = await prisma.show.create({
        data: {
          name: `WWE Raw #${Math.floor(Math.random() * 1000)}`,
          date,
          promotion: 'WWE',
          showType: 'TV'
        }
      });

      const match = await prisma.match.create({
        data: {
          showId: show.id,
          matchType: 'Singles',
          isMainEvent: j === 0,
          participants: {
            create: {
              wrestlerId: fa.id,
              result: isWin ? 'WIN' : 'LOSS'
            }
          }
        }
      });
    }
  }

  console.log(`✅ Seeded matches for ${freeAgents.length} free agents.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
