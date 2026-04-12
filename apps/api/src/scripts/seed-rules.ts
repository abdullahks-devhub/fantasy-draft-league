/**
 * seed-rules.ts
 * Seeds all 26 scoring rules based on the official Fantasy League ruleset.
 * Safe to run multiple times — it clears rules for the active season first.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) throw new Error('No active season found. Create a season first.');
  console.log(`Seeding rules for season: ${season.name} (${season.id})`);

  // Clear existing rules for this season
  await prisma.pointRule.deleteMany({ where: { seasonId: season.id } });

  const rules = [
    // ── NORMAL (TV shows) ────────────────────────────────────
    {
      label: 'TV Singles Win',
      showType: 'TV', matchType: 'Singles', result: 'WIN', isMainEvent: false,
      points: 1, code: 'TVW'
    },
    {
      label: 'TV Tag Win',
      showType: 'TV', matchType: 'Tag Team', result: 'WIN', isMainEvent: false,
      points: 1, code: 'TVTW'
    },
    {
      label: 'TV Main Event Appearance',
      showType: 'TV', isMainEvent: true, result: null,
      points: 3, code: 'TVMEA'
    },
    {
      label: 'TV Main Event Win',
      showType: 'TV', isMainEvent: true, result: 'WIN',
      points: 6, code: 'TVMEW'
    },

    // ── PPV ──────────────────────────────────────────────────
    {
      label: 'PPV Singles Win',
      showType: 'PPV', matchType: 'Singles', result: 'WIN', isMainEvent: false,
      points: 4, code: 'PPVW'
    },
    {
      label: 'PPV Tag Win',
      showType: 'PPV', matchType: 'Tag Team', result: 'WIN', isMainEvent: false,
      points: 4, code: 'PPVTW'
    },
    {
      label: 'PPV Main Event Appearance',
      showType: 'PPV', isMainEvent: true, result: null,
      points: 5, code: 'PPVMEA'
    },
    {
      label: 'PPV Main Event Win',
      showType: 'PPV', isMainEvent: true, result: 'WIN',
      points: 12, code: 'PPVMEW'
    },

    // ── TITLE MATCHES ─────────────────────────────────────────
    {
      label: 'Title Win',
      isTitleMatch: true, isWorldTitle: false, result: 'WIN', isDefense: false,
      points: 10, code: 'TW'
    },
    {
      label: 'World Title Win',
      isTitleMatch: true, isWorldTitle: true, result: 'WIN', isDefense: false,
      points: 15, code: 'WTW'
    },
    {
      label: 'Title Defense',
      isTitleMatch: true, isWorldTitle: false, result: 'WIN', isDefense: true,
      points: 5, code: 'TD'
    },
    {
      label: 'World Title Defense',
      isTitleMatch: true, isWorldTitle: true, result: 'WIN', isDefense: true,
      points: 10, code: 'WTD'
    },

    // ── SINGLE ELIM TOURNAMENT ────────────────────────────────
    {
      label: 'Single Elim Tournament Appearance',
      isTournament: true, tournamentType: 'SINGLE_ELIM', isFinals: false, isRunnerUp: false,
      points: 3, code: 'SETA'
    },
    {
      label: 'Single Elim Tournament Match Win',
      isTournament: true, tournamentType: 'SINGLE_ELIM', isFinals: false, result: 'WIN', isRunnerUp: false,
      points: 5, code: 'SETW'
    },
    {
      label: 'Single Elim Runner-Up',
      isTournament: true, tournamentType: 'SINGLE_ELIM', isFinals: true, isRunnerUp: true,
      points: 15, code: 'SERU'
    },
    {
      label: 'Single Elim Tournament Winner',
      isTournament: true, tournamentType: 'SINGLE_ELIM', isFinals: true, result: 'WIN', isRunnerUp: false,
      points: 25, code: 'SETWIN'
    },

    // ── ROUND ROBIN TOURNAMENT ────────────────────────────────
    {
      label: 'Round Robin Tournament Appearance',
      isTournament: true, tournamentType: 'ROUND_ROBIN', isFinals: false, isRunnerUp: false,
      points: 1, code: 'RRTA'
    },
    {
      label: 'Round Robin Tournament Match Win',
      isTournament: true, tournamentType: 'ROUND_ROBIN', isFinals: false, result: 'WIN', isRunnerUp: false,
      points: 3, code: 'RRTW'
    },
    {
      label: 'Round Robin Runner-Up',
      isTournament: true, tournamentType: 'ROUND_ROBIN', isFinals: true, isRunnerUp: true,
      points: 10, code: 'RRRU'
    },
    {
      label: 'Round Robin Tournament Winner',
      isTournament: true, tournamentType: 'ROUND_ROBIN', isFinals: true, result: 'WIN', isRunnerUp: false,
      points: 20, code: 'RRTWIN'
    },

    // ── SPECIAL EVENTS ────────────────────────────────────────
    {
      label: 'Royal Rumble Win',
      specialEvent: 'ROYAL_RUMBLE', result: 'WIN',
      points: 50, code: 'RRW'
    },
    {
      label: 'Money in the Bank Win',
      specialEvent: 'MITB', result: 'WIN',
      points: 30, code: 'MITBW'
    },
    {
      label: 'Face/Heel Turn',
      specialEvent: 'FACE_HEEL_TURN',
      points: 5, code: 'FHT'
    },
  ];

  let created = 0;
  for (const rule of rules) {
    await (prisma.pointRule as any).create({
      data: {
        seasonId: season.id,
        ...rule,
        result: rule.result as any ?? undefined,
      }
    });
    created++;
    console.log(`  ✓ ${rule.label} (${rule.points} pts) [${rule.code}]`);
  }

  console.log(`\n✅ Seeded ${created} rules for "${season.name}".`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
