import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Booting Season 4 Production Data...');

  // 1. Create Season 4 (Active)
  const season = await prisma.season.upsert({
    where: { name: 'Season 4' },
    update: { status: 'ACTIVE', isActive: true }, // Ensure it is the active one
    create: {
      name: 'Season 4',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-12-31'),
      status: 'ACTIVE',
      isActive: true
    }
  });

  // Ensure all other seasons are NOT active
  await prisma.season.updateMany({
    where: { id: { not: season.id } },
    data: { isActive: false }
  });

  const players = [
    'Wolfie', 'Carl', 'Vege', 'Kon', 'Ant', 'Eddie', 'Laso', 'John', 
    'Connor', 'Mesh', 'Tatum', 'KML'
  ];

  const dbPlayers: Record<string, any> = {};

  for (const name of players) {
    const email = `${name.toLowerCase()}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, role: 'PLAYER' }
    });
    dbPlayers[name] = user;

    // Create PlayerSeason for Season 4
    await prisma.playerSeason.upsert({
      where: {
        userId_seasonId: { userId: user.id, seasonId: season.id }
      },
      update: {},
      create: { seasonId: season.id, userId: user.id }
    });
  }

  // 2. Assign Rosters (Based on user input for Season 3/4)
  const rosterMap: Record<string, string[]> = {
    'Wolfie': ['Rhea Ripley', 'Alpha Wolf', 'ENV (Hanako + Waka)', 'Dragon Bane', 'Konami', 'Bron Breakker', 'Darby Allin', 'Joe Hendry', 'Seth Rollins', 'Jacob Fatu'],
    'Carl': ['Moxley + Garcia', 'Kenny Omega', 'Naomichi Marufuji', 'Masa Kitamiya', 'Bayley', 'Kazuchika Okada', 'Sami Zayn', 'Drew McIntyre', 'The Usos', 'Ricochet'],
    'Vege': ['Cody Rhodes', 'Ryohei Oiwa', 'Konosuke Takeshita', 'Sol Ruca', 'Yuto Ice + Oskar', 'Gunther', 'Carmelo Hayes', 'FTR', 'Tommaso Ciampa'],
    'Kon': ['Kenta + Ulka Sasaki', 'Rian', 'Mei Seira + Miyu Amasaki', 'Kyle Fletcher', 'Saki Kashima', 'Thekla', 'Daga', 'Koguma', 'Tetsuya Endo'],
    'Ant': ['Saya Kamitani', 'Athena', 'Oba Femi', 'Swerve Strickland', 'Hank + Tank', 'Starlight Kid', 'AZM', 'Mayu Iwatani', 'Hazuki'],
    'Eddie': ['El Kaiser Americano', 'Moose', 'Mike Santana', 'Lash Legend', 'Jake Lee + Andrade', 'MJF', 'The Hardys', 'Steve Maclin', 'Mike Bailey'],
    'Laso': ['Natsupoi', 'Yoshiki Inamura', 'ZSJ', 'Bandido', 'El Desperado', 'Ozawa', 'Syuri + Ami Sourei', 'Shota Umino', 'Evil + Ren Narita'],
    'John': ['Oleg Boltin + Yuya Uemura', 'Francesco Akira', 'Yota Tsuji', 'Taiji Ishimori', 'Arianna Grace', 'Douki', 'Sho + Yoshinobu Kanemaru', 'Shingo Takagi', 'David Finlay'],
    'Connor': ['Tiffany Stratton', 'Sheamus', 'Aleister Black', 'Rina', 'Mustafa Ali'],
    'Mesh': ['Jordynne Grace', 'Ilja Dragunov', 'Adam Page', 'Iyo Sky', 'Samoa Joe'],
    'Tatum': ['Gunther', 'Seth Rollins', 'Roman Reigns', 'Finn Balor', 'Buddy Matthews'],
    'KML': ['Kazuchika Okada', 'CM Punk', 'Solo Sikoa', 'Karrion Kross', 'The Young Bucks']
  };

  const getOrCreateWrestler = async (name: string) => {
    let w = await prisma.wrestler.findFirst({ where: { name } });
    if (!w) {
      w = await prisma.wrestler.create({ data: { name, active: true } });
    } else {
      await prisma.wrestler.update({ where: { id: w.id }, data: { active: true } });
    }
    return w;
  };

  for (const [playerName, wrestlers] of Object.entries(rosterMap)) {
    const user = dbPlayers[playerName];
    const playerSeason = await prisma.playerSeason.findUnique({
      where: { userId_seasonId: { userId: user.id, seasonId: season.id } }
    });

    if (!playerSeason) continue;

    // Clean existing roster slots for this season to re-populate
    await prisma.rosterSlot.deleteMany({ where: { playerSeasonId: playerSeason.id } });

    for (const wName of wrestlers) {
      const wrestler = await getOrCreateWrestler(wName);
      await prisma.rosterSlot.create({
        data: {
          playerSeasonId: playerSeason.id,
          status: 'ACTIVE',
          wrestlers: { connect: [{ id: wrestler.id }] }
        }
      });
    }
  }

  // 3. Create a Demo Show and Matches
  console.log('📝 Seeding Demo Match Data for Season 4 Week 1...');
  const show = await prisma.show.create({
    data: {
      name: 'WWE RAW - Week 1 Demo',
      date: new Date(),
      cagematchId: 'demo-1',
      promotion: 'WWE',
      showType: 'TV'
    }
  });

  const cody = await getOrCreateWrestler('Cody Rhodes');
  const gunther = await getOrCreateWrestler('Gunther');

  await prisma.match.create({
    data: {
      showId: show.id,
      matchType: 'Single Match',
      participants: {
        create: [
          { wrestlerId: cody.id, result: 'WIN' },
          { wrestlerId: gunther.id, result: 'LOSS' }
        ]
      }
    }
  });

  // Calculate points for this week (Week 1)
  // We'll just add a few points manually for the demo
  for (const playerName of players) {
    const user = dbPlayers[playerName];
    const playerSeason = await prisma.playerSeason.findFirst({
      where: { seasonId: season.id, userId: user.id }
    });
    if (playerSeason) {
      await prisma.playerPoint.deleteMany({ where: { playerSeasonId: playerSeason.id, weekNumber: 1 } });
      await prisma.playerPoint.create({
        data: {
          playerSeasonId: playerSeason.id,
          weekNumber: 1,
          points: playerName === 'Vege' ? 20 : 5 // Cody is with Vege, so 20 pts for demo
        }
      });
    }
  }

  console.log('✅ Season 4 Live Boot Complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
