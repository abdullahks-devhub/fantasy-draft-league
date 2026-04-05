import prisma from '../lib/db';

/**
 * Automatically archives a season after its end date has passed.
 * Triggered by the BullMQ worker.
 */
export async function archiveExpiredSeasons() {
  const now = new Date();
  
  try {
    const expiredSeasons = await prisma.season.findMany({
      where: {
        isActive: true,
        endDate: { lte: now }
      }
    });

    for (const season of expiredSeasons) {
      console.log(`[Archive] Automatically closing season: ${season.name} (${season.id})`);
      await prisma.season.update({
        where: { id: season.id },
        data: { isActive: false }
      });
    }
  } catch (error) {
    console.error('[Archive Error] Failed to auto-archive seasons:', error);
  }
}
