import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function audit() {
  console.log('--- PRODUCTION DATA AUDIT ---');
  
  // 1. Rules Check
  const rules = await prisma.pointRule.findMany();
  console.log('Total Point Rules:', rules.length);
  const meWin = rules.find(r => r.isMainEvent === true && r.result === 'WIN');
  const baseWin = rules.find(r => r.isMainEvent === null && r.result === 'WIN');
  console.log('Stacking Check:', 
    meWin ? `Main Event Bonus enabled (${meWin.points} pts)` : 'ME Win rule missing',
    baseWin ? `Base Win enabled (${baseWin.points} pts)` : 'Base Win rule missing'
  );

  // 2. Tournament Metadata Check
  const matches = await prisma.match.findMany({
    where: { isTournament: true },
    take: 5
  });
  console.log('Tournament Matches Found:', matches.length);
  matches.forEach(m => console.log(` - ${m.rawText} (Type: ${(m as any).tournamentType}, Finals: ${m.isFinals})`));

  // 3. Roster Limit Verification
  const slots = await prisma.rosterSlot.findMany();
  const playerGroups: Record<string, any[]> = {};
  slots.forEach(s => {
    if (!playerGroups[s.playerSeasonId]) playerGroups[s.playerSeasonId] = [];
    playerGroups[s.playerSeasonId].push(s);
  });

  console.log('Roster Integrity:');
  Object.entries(playerGroups).slice(0, 3).forEach(([id, pSlots]) => {
    const active = pSlots.filter(s => s.status === 'ACTIVE').length;
    const bench = pSlots.filter(s => s.status === 'BENCH').length;
    const ir = pSlots.filter(s => s.status === 'IR').length;
    console.log(` - Player ${id.substring(0,8)}: ${active} Active, ${bench} Bench, ${ir} IR (Total Base: ${active + bench})`);
  });

  // 4. Branding Check
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  console.log('Active Season Branding:', season?.name === 'Season 4' ? 'Correct' : 'Needs Check');
}

audit().finally(() => prisma.$disconnect());
