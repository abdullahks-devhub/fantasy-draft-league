import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Updating Season History for 2025-2026...');
  
  // Season 1: Jan-June 2025
  const s1 = await prisma.season.findFirst({ where: { name: 'Season 1' } });
  if (s1) {
    await prisma.season.update({
      where: { id: s1.id },
      data: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        status: 'COMPLETED',
        isActive: false
      }
    });
    console.log('✅ Updated Season 1 to 2025 (H1)');
  }

  // Season 2: July-Dec 2025
  const s2 = await prisma.season.findFirst({ where: { name: 'Season 2' } });
  if (s2) {
    await prisma.season.update({
      where: { id: s2.id },
      data: {
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-12-31'),
        status: 'COMPLETED',
        isActive: false
      }
    });
    console.log('✅ Updated Season 2 to 2025 (H2)');
  }

  // Season 3: Jan-April 2026
  const s3 = await prisma.season.findFirst({ where: { name: 'Season 3' } });
  if (s3) {
    await prisma.season.update({
      where: { id: s3.id },
      data: {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-04-30'),
        status: 'COMPLETED',
        isActive: false
      }
    });
    console.log('✅ Updated Season 3 to 2026 (Spring)');
  }

  // Season 4: Starting April/May 2026 (ACTIVE)
  const s4 = await prisma.season.findFirst({ where: { name: 'Season 4' } });
  if (s4) {
    await prisma.season.update({
      where: { id: s4.id },
      data: {
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        isActive: true
      }
    });
    console.log('✅ Updated Season 4 to 2026 (Live)');
  }

  console.log('✅ Season history updated!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
