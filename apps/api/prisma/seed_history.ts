import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Historical Data Seed...');

  // --- PLAYERS LIST ---
  // Ensuring all 12 unique players exist across all seasons
  const playerNames = [
    'Wolfie', 'Carl', 'Vege', 'Kon', 'Ant', 'Eddie', 'Laso', 'John', 
    'Connor', 'Mesh', 'Tatum', 'KML'
  ];

  const dbPlayers: Record<string, any> = {};

  // Clean historical records to allow fresh injection
  await prisma.playerPoint.deleteMany();
  await prisma.rosterSlot.deleteMany();
  await prisma.playerSeason.deleteMany({ where: { season: { status: 'COMPLETED' } } });
  await prisma.season.deleteMany({ where: { status: 'COMPLETED' } });

  for (const name of playerNames) {
    const email = `${name.toLowerCase()}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, role: 'PLAYER' }
    });
    dbPlayers[name] = user;
  }

  // Helper to ensure wrestlers exist
  const getOrCreateWrestler = async (name: string) => {
    let w = await prisma.wrestler.findFirst({ where: { name } });
    if (!w) {
      w = await prisma.wrestler.create({ data: { name, active: false } });
    }
    return w;
  };

  // --- HISTORY DATA OBJECT ---
  const history = [
    {
      name: 'Season 1',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-06-30'),
      winner: 'Laso',
      standings: [
        { name: 'Laso', points: 1024, roster: ['ZSJ + Robbie Eagles', 'David Finlay', 'Syuri', 'Bandido', 'Master Wato', 'El Phantasmo', 'El Desperado', 'Hiromu Takahashi', 'Shingo Takagi + Titan', 'Starlight Kid'] },
        { name: 'John', points: 1002, roster: ['Yota Tsuji', 'Callum Newman + Francesco Akira', 'Mercedes Mone', 'Oleg Boltin', 'Toni Storm', 'Adam Cole', 'Asuka', 'Yoh', 'Jade Cargill', 'Yoshinobu Kanemaru + Sho'] },
        { name: 'Eddie', points: 751, roster: ['Drew McIntyre', 'Jey Uso', 'Joe Hendry', 'Fraxiom', 'Masha Slamovich', 'Dominik Mysterio', 'Trick Williams', 'Noam Dar', 'Clark Connors', 'Kevin Knight + Speedball'] }, // Mapped from Supernova
        { name: 'KML', points: 554, roster: ['Kenny Omega', 'Jacob Fatu', 'Giulia', 'Kazuchika Okada', 'Shota Umino', 'CM Punk', 'Stephanie Vaquer', 'Sanada', 'Randy Orton', 'DarkState'] },
        { name: 'Vege', points: 540, roster: ['Cody Rhodes', 'New Day', 'Konosuke Takeshita', 'Hurt Syndicate', 'Mei Seira', 'Carmelo Hayes', 'Great O Khan', 'Tetsuya Naito', 'AZM', 'Ricochet'] }, // Mapped from Broccoli
        { name: 'Connor', points: 506, roster: ['Jacy Jayne', 'Bianca', 'Bron Breakker', 'Je\'von Evans', 'Zelina Vega', 'Liv and Raquel', 'Hirooki Goto', 'Chad Gable', 'FTR', 'Matt Jackson'] },
        { name: 'Carl', points: 474, roster: ['Jon Moxley', 'LA Knight', 'Kosei Fujita', 'Nic Nemeth', 'Wes Lee', 'Ace Austin', 'Nick Wayne', 'Moose', 'Tony D\'Angelo', 'Austin Theory'] },
        { name: 'Mesh', points: 436, roster: ['Samoa Joe', 'Jordynne Grace', 'Iyo Sky', 'Gabe Kidd', 'John Cena', 'Sami Zayn', 'Adam Page', 'Omos', 'Charlie Dempsey', 'AJ Styles'] },
        { name: 'Ant', points: 407, roster: ['Will Ospreay', 'Roxanne Perez', 'Swerve Strickland', 'Malakai Black', 'Sol Ruca', 'Saya Kimatani', 'Logan Paul', 'Athena', 'Becky Lynch', 'Street Profits'] },
        { name: 'Wolfie', points: 313, roster: ['Rhea Ripley', 'Penta', 'Tiffany Stratton', 'ENV (Hanako and Waka Tsukiyama)', 'MJF', 'Lyra Valkyria', 'Hank and Tank', 'Damien Priest', 'Alexa Bliss', 'Rey Fenix'] },
        { name: 'Kon', points: 257, roster: ['Hobbs', 'Tomohiro Ishii', 'Mayu Iwatani', 'Lexis King', 'Koguma', 'Hazuki', 'Blake Christian', 'Big Bill + Bryan Keith', 'Megan Bayne', 'Kris Statlander'] },
        { name: 'Tatum', points: 152, roster: ['Gunther', 'Roman Reigns', 'Seth Rollins', 'Candice LeRae', 'Chris Hero', 'RVD', 'Buddy Matthews', 'Finn Balor', 'Darby Allin', 'Eddie Kingston'] },
      ]
    },
    {
      name: 'Season 2',
      startDate: new Date('2023-07-01'),
      endDate: new Date('2023-12-31'),
      winner: 'John',
      standings: [
        { name: 'John', points: 1582, roster: ['Oleg Boltin + Yuya Uemura', 'Yoshi Hashi', 'Hiromu Takahashi', 'Toni Storm', 'Deonna Purazzo', 'Yota Tsuji + Shingo', 'Mina Shirakawa', 'Billie Starkz', 'Harley Cameron', 'Willow'] },
        { name: 'Laso', points: 1378, roster: ['Natsupoi + Sayaka Kurara', 'Lee Moriarty', 'Shota Umino', 'Lance Archer', 'Evil + Ren Narita', 'El Phantasmo', 'Yoshiki Inamura', 'ZSJ', 'Bandido', 'El Desperado'] },
        { name: 'Eddie', points: 991, roster: ['Ricky Saints', 'Great O-Khan', 'Kevin Knight', 'The Hardys', 'Frankie Kazarian', 'Leon Slater + Je\'von Evans', 'Lei Ying Lee', 'Toru Yano', 'Ethan Page', 'Mark Briscoe'] },
        { name: 'Ant', points: 796, roster: ['Saya Kamitani', 'Charlotte Flair', 'Becky Lynch', 'God\'s Eye (Syuri + Ami Sourei)', 'Ozawa', 'Maika', 'Athena', 'Oba Femi', 'Mike Santana', 'Momo Watanabe'] },
        { name: 'Kon', points: 792, roster: ['Kenta + Ulka Sasaki', 'Kaito Kiyomiya + Kenoh', 'Sho + Yujiro Takahashi', 'Hologram', 'Sanada', 'Tetsuya Endo', 'Rina', 'Manabu Soya', 'Yoshinobu Kanemaru'] },
        { name: 'Vege', points: 785, roster: ['Cody Rhodes', 'Ryohei Oiwa', 'Konosuke Takeshita', 'Hurt Syndicate', 'AZM', 'Sol Ruca', 'Taichi + Kojima', 'Yuto Ice & Oskar', 'Carmelo Hayes', 'Rusev'] },
        { name: 'Mesh', points: 783, roster: ['Jordynne Grace', 'Ilja Dragunov', 'Dragon Lee', 'Adam Page', 'Iyo Sky', 'David Finlay', 'Samoa Joe', 'Kyle Fletcher', 'Hiroshi Tanahashi', 'Kris Statlander'] },
        { name: 'Connor', points: 523, roster: ['Bron Breakker', 'FTR', 'Hirooki Goto', 'Jacy Jayne', 'Megan Bayne', 'Sami Zayn', 'MJF', 'El Hijo del Dr. Wagner', 'Bozilla', 'Psycho Clown'] },
        { name: 'Carl', points: 495, roster: ['Moxley + Garcia', 'Moose', 'Ash by Elegance', 'LA Knight', 'Kenny Omega', 'Naomichi Marufuji', 'Masa Kitamiya', 'Hina', 'Brody King', 'Mustafa Ali'] },
        { name: 'Wolfie', points: 477, roster: ['Tiffany Stratton', 'Rhea Ripley', 'Alpha Wolf', 'Sheamus', 'ENV (Hanako + Waka)', 'Dragon Bane', 'Damian Priest', 'Konami', 'Aleister Black', 'Takumi Iroha'] },
        { name: 'KML', points: 419, roster: ['Kazuchika Okada', 'Stephanie Vaquer', 'CM Punk', 'Jacob Fatu', 'Giulia', 'The Young Bucks', 'Solo Sikoa', 'Karrion Kross', 'Nic Nemeth', 'MCMG'] },
        { name: 'Tatum', points: 351, roster: ['Gunther', 'Seth Rollins', 'Darby Allin', 'Roman Reigns', 'Finn Balor', 'Candice LeRae', 'Buddy Matthews', 'Eddie Kingston', 'Ricochet', 'Pac'] },
      ]
    },
    {
      name: 'Season 3',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      winner: 'John',
      standings: [
        { name: 'John', points: 832, roster: ['Oleg Boltin + Yuya Uemura', 'Francesco Akira', 'Yota Tsuji', 'Taiji Ishimori', 'Arianna Grace', 'Douki', 'Sho + Yoshinobu Kanemaru', 'Shingo Takagi', 'David Finlay', 'Callum Newman'] },
        { name: 'Eddie', points: 612, roster: ['El Kaiser Americano', 'Moose', 'Mike Santana', 'Lash Legend', 'Jake Lee + Andrade', 'MJF', 'The Hardys', 'Steve Maclin', 'Mike Bailey', 'Leon Slater + Je\'von Evans'] },
        { name: 'Laso', points: 465, roster: ['Natsupoi', 'Yoshiki Inamura', 'ZSJ', 'Bandido', 'El Desperado', 'Ozawa', 'Syuri + Ami Sourei', 'Shota Umino', 'Evil + Ren Narita', 'Hirooki Goto'] },
        { name: 'Wolfie', points: 437, roster: ['Rhea Ripley', 'Alpha Wolf', 'ENV', 'Dragon Bane', 'Konami', 'Bron Breakker', 'Darby Allin', 'Joe Hendry', 'Seth Rollins', 'Jacob Fatu'] },
        { name: 'Vege', points: 362, roster: ['Cody Rhodes', 'Ryohei Oiwa', 'Konosuke Takeshita', 'Sol Ruca', 'Yuto Ice + Oskar', 'Gunther', 'Carmelo Hayes', 'FTR', 'Tommaso Ciampa', 'Liv Morgan'] },
        { name: 'Carl', points: 264, roster: ['Moxley + Garcia', 'Kenny Omega', 'Naomichi Marufuji', 'Masa Kitamiya', 'Bayley', 'Kazuchika Okada', 'Sami Zayn', 'Drew McIntyre', 'The Usos', 'Ricochet'] },
        { name: 'Kon', points: 250, roster: ['Kenta + Ulka Sasaki', 'Rian', 'Mei Seira + Miyu Amasaki', 'Kyle Fletcher', 'Saki Kashima', 'Thekla', 'Daga', 'Koguma', 'Tetsuya Endo', 'Kaito Kiyomiya + Kenoh'] },
        { name: 'Ant', points: 201, roster: ['Saya Kamitani', 'Athena', 'Oba Femi', 'Swerve Strickland', 'Hank + Tank', 'Starlight Kid', 'AZM', 'Mayu Iwatani', 'Hazuki', 'Utami Hayashishita'] },
      ]
    }
  ];

  for (const sData of history) {
    const winnerUser = dbPlayers[sData.winner];
    
    // Create completed season
    const season = await prisma.season.create({
      data: {
        name: sData.name,
        startDate: sData.startDate,
        endDate: sData.endDate,
        isActive: false,
        status: 'COMPLETED',
        winnerId: winnerUser.id
      }
    });

    console.log(`Generating ${season.name}...`);

    for (const playerState of sData.standings) {
      const pUser = dbPlayers[playerState.name];
      if (!pUser) continue;

      const playerSeason = await prisma.playerSeason.create({
        data: {
          seasonId: season.id,
          userId: pUser.id,
          locked: true
        }
      });

      // Add their final points
      await prisma.playerPoint.create({
        data: {
          playerSeasonId: playerSeason.id,
          weekNumber: 25, // Arbitrary end-of-season week
          points: playerState.points
        }
      });

      // Add their roster
      for (const wName of playerState.roster) {
        if (!wName) continue;
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
  }

  console.log('✅ History generation complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
