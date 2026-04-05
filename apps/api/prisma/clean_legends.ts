import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function run() {
  console.log('Starting Free Agent Pruning (365-day inactivity)...');
  const yearAgo = subDays(new Date(), 365);

  // Find wrestlers who:
  // 1. Have NEVER had a match in our system OR
  // 2. Their last match was more than 365 days ago
  const wrestlers = await prisma.wrestler.findMany({
    include: {
      matchInvolvements: {
        include: { match: { include: { show: true } } },
        orderBy: { match: { show: { date: 'desc' } } },
        take: 1
      }
    }
  });

  let prunedCount = 0;
  for (const w of wrestlers) {
    const lastMatchDate = w.matchInvolvements[0]?.match.show.date;
    
    if (!lastMatchDate || lastMatchDate < yearAgo) {
      await prisma.wrestler.update({
        where: { id: w.id },
        data: { active: false }
      });
      prunedCount++;
    } else {
      // Ensure they ARE active if they have recent matches
      await prisma.wrestler.update({
        where: { id: w.id },
        data: { active: true }
      });
    }
  }

  console.log(`✅ Pruning complete! Marked ${prunedCount} wrestlers as inactive.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
