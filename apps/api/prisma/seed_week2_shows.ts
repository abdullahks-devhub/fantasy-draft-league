import { PrismaClient, Result } from '@prisma/client';

const prisma = new PrismaClient();

// Maps player email prefix to their wrestler names for S1 Week 2 data
// Based on user's provided data:
// M=Mesh, L=Laso, K=KML, D=Dylan, C=Carl, A=A(EW), John, Vege, Kon, Wolfie, Eddie
const WEEK2_SHOWS = [
  {
    name: 'WWE Raw',
    date: new Date('2025-02-10'),
    promotion: 'WWE',
    showType: 'TV',
    matches: [
      {
        matchType: 'Tag Team',
        isMainEvent: false,
        winners: ['Iyo Sky', 'Dakota Kai'],
        losers: ['Liv Morgan', 'Raquel Rodriguez'],
      },
      {
        matchType: 'Singles',
        isMainEvent: false,
        winners: ['Bayley'],
        losers: ['Lyra Valkyria'],
      },
      {
        matchType: 'Tag Team',
        isMainEvent: false,
        isTitleMatch: true,
        winners: ['Ivar', 'Erik'],
        losers: ['Chad Gable', 'Julius Creed'],
      },
      {
        matchType: 'Singles',
        isMainEvent: true,
        winners: ['Logan Paul'],
        losers: ['Rey Mysterio'],
      },
    ],
  },
  {
    name: 'NJPW New Beginning in Osaka',
    date: new Date('2025-02-11'),
    promotion: 'NJPW',
    showType: 'PPV',
    matches: [
      { matchType: 'Singles', isMainEvent: false, winners: ['SANADA'], losers: ['Taichi'] },
      { matchType: 'Singles', isMainEvent: false, isTitleMatch: true, winners: ['Konosuke Takeshita'], losers: ['Boltin Oleg'] },
      { matchType: 'Tag Team', isMainEvent: false, isTitleMatch: true, isWorldTitle: true, winners: ['Hiromu Takahashi', 'Tetsuya Naito'], losers: ['Matt Jackson', 'Nick Jackson'] },
      { matchType: 'Singles', isMainEvent: false, draw: true, wrestlers: ['Yota Tsuji', 'Gabe Kidd'] },
      { matchType: 'Singles', isMainEvent: true, winners: ['Hirooki Goto'], losers: ['Zack Sabre Jr.'] },
    ],
  },
  {
    name: 'NXT',
    date: new Date('2025-02-11'),
    promotion: 'WWE',
    showType: 'TV',
    matches: [
      { matchType: 'Singles', isMainEvent: false, isTitleMatch: true, winners: ['Lexis King'], losers: ['Je\'Von Evans'] },
      { matchType: 'Singles', isMainEvent: true, winners: ['Tony D\'Angelo'], losers: ['Ridge Holland'] },
    ],
  },
  {
    name: 'AEW Dynamite',
    date: new Date('2025-02-12'),
    promotion: 'AEW',
    showType: 'TV',
    matches: [
      { matchType: 'Singles', isMainEvent: false, winners: ['Hangman Adam Page'], losers: ['Max Caster'] },
      { matchType: 'Tag Team', isMainEvent: false, isTitleMatch: true, winners: ['Claudio Castagnoli', 'Jon Moxley'], losers: ['Mark Davis', 'Kyle Fletcher'] },
      { matchType: 'Tag Team', isMainEvent: false, winners: ['Hook', 'Samoa Joe'], losers: ['The Workhorsemen'] },
      { matchType: 'Singles', isMainEvent: false, winners: ['MJF'], losers: ['Dustin Rhodes'] },
      { matchType: 'Singles', isMainEvent: false, winners: ['Kris Statlander'], losers: ['Penelope Ford'] },
      { matchType: 'Singles', isMainEvent: true, winners: ['Bobby Lashley'], losers: ['Austin Gunn'] },
    ],
  },
];

async function upsertWrestler(name: string) {
  return prisma.wrestler.upsert({
    where: { cagematchId: `manual-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
    update: { name, active: true },
    create: {
      cagematchId: `manual-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      active: true,
    },
  });
}

async function run() {
  console.log('Seeding Season 1 Week 2 show data...');

  for (const showData of WEEK2_SHOWS) {
    const show = await prisma.show.upsert({
      where: { cagematchId: `manual-${showData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${showData.date.toISOString().split('T')[0]}` },
      update: {},
      create: {
        cagematchId: `manual-${showData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${showData.date.toISOString().split('T')[0]}`,
        name: showData.name,
        date: showData.date,
        promotion: showData.promotion,
        showType: showData.showType,
      },
    });

    console.log(`Show: ${show.name}`);

    for (const matchData of showData.matches) {
      const isDraw = (matchData as any).draw === true;

      const match = await prisma.match.create({
        data: {
          showId: show.id,
          matchType: matchData.matchType,
          isMainEvent: matchData.isMainEvent ?? false,
          isTournament: false,
        },
      });

      if (isDraw) {
        for (const name of (matchData as any).wrestlers) {
          const w = await upsertWrestler(name);
          await prisma.matchParticipant.upsert({
            where: { matchId_wrestlerId: { matchId: match.id, wrestlerId: w.id } },
            update: {},
            create: {
              matchId: match.id,
              wrestlerId: w.id,
              result: Result.DRAW,
              isTitleMatch: (matchData as any).isTitleMatch ?? false,
              isWorldTitle: (matchData as any).isWorldTitle ?? false,
            },
          });
        }
      } else {
        for (const name of (matchData as any).winners ?? []) {
          const w = await upsertWrestler(name);
          await prisma.matchParticipant.upsert({
            where: { matchId_wrestlerId: { matchId: match.id, wrestlerId: w.id } },
            update: {},
            create: {
              matchId: match.id,
              wrestlerId: w.id,
              result: Result.WIN,
              isTitleMatch: (matchData as any).isTitleMatch ?? false,
              isWorldTitle: (matchData as any).isWorldTitle ?? false,
            },
          });
        }
        for (const name of (matchData as any).losers ?? []) {
          const w = await upsertWrestler(name);
          await prisma.matchParticipant.upsert({
            where: { matchId_wrestlerId: { matchId: match.id, wrestlerId: w.id } },
            update: {},
            create: {
              matchId: match.id,
              wrestlerId: w.id,
              result: Result.LOSS,
              isTitleMatch: (matchData as any).isTitleMatch ?? false,
              isWorldTitle: (matchData as any).isWorldTitle ?? false,
            },
          });
        }
      }
    }
  }

  console.log('✅ Season 1 Week 2 data seeded successfully!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
