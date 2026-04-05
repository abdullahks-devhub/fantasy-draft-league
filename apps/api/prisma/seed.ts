import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fantasy.com' },
    update: {},
    create: {
      email: 'admin@fantasy.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Players
  const playerNames = ['Abdullah', 'John', 'Jane', 'Brie', 'Cody', 'Roman', 'Seth', 'Becky', 'Charlotte', 'Bayley'];
  const players = [];
  for (const name of playerNames) {
    const email = `${name.toLowerCase()}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        role: 'PLAYER',
      },
    });
    players.push(user);
  }

  // 3. Create Season
  const season = await prisma.season.upsert({
    where: { name: 'Season 4' },
    update: {
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
    create: {
      name: 'Season 4',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });

  // 4. Create PlayerSeasons (upsert to handle re-runs)
  const playerSeasons = [];
  for (const player of players) {
    const ps = await prisma.playerSeason.upsert({
      where: {
        userId_seasonId: {
          userId: player.id,
          seasonId: season.id,
        }
      },
      update: {},
      create: {
        userId: player.id,
        seasonId: season.id,
      },
    });
    playerSeasons.push(ps);
  }

  // 5. Create some Wrestlers
  const wrestlersData = [
    { name: 'Cody Rhodes', currentTeam: 'WWE' },
    { name: 'Seth Rollins', currentTeam: 'WWE' },
    { name: 'Kenny Omega', currentTeam: 'AEW' },
    { name: 'Will Ospreay', currentTeam: 'AEW' },
    { name: 'Kazuchika Okada', currentTeam: 'AEW' },
    { name: 'Gunther', currentTeam: 'WWE' },
    { name: 'MJF', currentTeam: 'AEW' },
    { name: 'Jade Cargill', currentTeam: 'WWE' },
    { name: 'Rhea Ripley', currentTeam: 'WWE' },
    { name: 'Toni Storm', currentTeam: 'AEW' },
  ];

  const wrestlers = [];
  for (const w of wrestlersData) {
    let wrestler = await prisma.wrestler.findFirst({
      where: { name: w.name }
    });

    if (!wrestler) {
      wrestler = await prisma.wrestler.create({
        data: {
          name: w.name,
          currentTeam: w.currentTeam,
          active: true,
        },
      });
    }
    wrestlers.push(wrestler);
  }

  // 6. Assign wrestlers to rosters (2 each for simplicity)
  for (let i = 0; i < playerSeasons.length; i++) {
    const ps = playerSeasons[i];
    const w1 = wrestlers[i % wrestlers.length];
    const w2 = wrestlers[(i + 1) % wrestlers.length];
    
    await prisma.rosterSlot.create({
      data: { 
        playerSeasonId: ps.id, 
        wrestlers: { connect: [{ id: w1.id }] }, 
        status: 'ACTIVE' 
      }
    });
    await prisma.rosterSlot.create({
      data: { 
        playerSeasonId: ps.id, 
        wrestlers: { connect: [{ id: w2.id }] }, 
        status: 'ACTIVE' 
      }
    });
  }

  // 7. Seed Point Rules (Wipe first)
  await prisma.pointRule.deleteMany({ where: { seasonId: season.id } });
  
  const rules = [
    // Normal (TV)
    { showType: 'TV', matchType: 'Singles', result: 'WIN', points: 1 },
    { showType: 'TV', matchType: 'Tag', result: 'WIN', points: 1 },
    { showType: 'TV', isMainEvent: true, points: 3 }, // Appearance
    { showType: 'TV', isMainEvent: true, result: 'WIN', points: 6 }, // Win
    
    // PPV
    { showType: 'PPV', matchType: 'Singles', result: 'WIN', points: 4 },
    { showType: 'PPV', matchType: 'Tag', result: 'WIN', points: 4 },
    { showType: 'PPV', isMainEvent: true, points: 5 }, // Appearance
    { showType: 'PPV', isMainEvent: true, result: 'WIN', points: 12 }, // Win

    // General (Championships)
    { isTitleMatch: true, result: 'WIN', points: 10, isDefense: false }, // Title Win
    { isTitleMatch: true, isWorldTitle: true, result: 'WIN', points: 15, isDefense: false }, // World Title Win
    { isTitleMatch: true, result: 'WIN', isDefense: true, points: 5 }, // Title Defense
    { isTitleMatch: true, isWorldTitle: true, result: 'WIN', isDefense: true, points: 10 }, // World Title Defense

    // Tournaments (Single Elim)
    { isTournament: true, tournamentName: 'Single Elim', points: 3 }, // App
    { isTournament: true, tournamentName: 'Single Elim', result: 'WIN', points: 5 }, // Win
    { isTournament: true, tournamentName: 'Single Elim', isFinals: true, result: 'WIN', points: 25 }, // Winner
    { isTournament: true, tournamentName: 'Single Elim', isFinals: true, result: 'LOSS', points: 15 }, // Runner-Up
    
    // Tournaments (Round Robin)
    { isTournament: true, tournamentName: 'Round Robin', points: 1 }, // App
    { isTournament: true, tournamentName: 'Round Robin', result: 'WIN', points: 3 }, // Win
    { isTournament: true, tournamentName: 'Round Robin', isFinals: true, result: 'WIN', points: 20 }, // Winner
    { isTournament: true, tournamentName: 'Round Robin', isFinals: true, result: 'LOSS', points: 10 }, // Runner-Up

    // Special Events
    { matchType: 'Royal Rumble', result: 'WIN', points: 50 },
    { matchType: 'MITB', result: 'WIN', points: 30 },
    { matchType: 'Face/Heel Turn', points: 5 } // Usually a manual adjustment or special "match"
  ];

  for (const rule of rules) {
    await prisma.pointRule.create({
      data: {
        ...rule,
        seasonId: season.id,
        result: rule.result as any
      }
    });
  }

  // 8. Create some dummy Points
  // ... (keeping dummy points logic)

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
