// Mock In-Memory Database for E-Rank System
// This is used if Firebase environment variables are not configured.

if (!global.mockDatabase) {
  const seedRanks = [
    {
      rankId: "rank-bree",
      rankName: "Bree Street Taxi Rank",
      city: "Johannesburg",
      province: "Gauteng",
      operatingHours: { open: "06:00", close: "22:00" },
      marshalId: "marshal-sizwe",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      rankId: "rank-kwamashu",
      rankName: "KwaMashu Taxi Rank",
      city: "Durban",
      province: "KwaZulu-Natal",
      operatingHours: { open: "06:00", close: "22:00" },
      marshalId: "marshal-lerato",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      rankId: "rank-bellville",
      rankName: "Bellville Taxi Rank",
      city: "Cape Town",
      province: "Western Cape",
      operatingHours: { open: "06:00", close: "22:00" },
      marshalId: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      rankId: "rank-bloemfontein",
      rankName: "Bloemfontein Taxi Rank",
      city: "Bloemfontein",
      province: "Free State",
      operatingHours: { open: "06:00", close: "22:00" },
      marshalId: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      rankId: "rank-kimberley",
      rankName: "Kimberley CBD Rank",
      city: "Kimberley",
      province: "Northern Cape",
      operatingHours: { open: "06:00", close: "21:00" },
      marshalId: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  ];

  const seedAdmins = [
    { uid: "admin-siya", email: "siya@taxirank.co.za", fullName: "Siya", role: "admin", createdAt: new Date().toISOString() },
    { uid: "admin-bron", email: "bron@taxirank.co.za", fullName: "Bron", role: "admin", createdAt: new Date().toISOString() },
    { uid: "admin-oara", email: "oara@taxirank.co.za", fullName: "Oara", role: "admin", createdAt: new Date().toISOString() },
    { uid: "admin-ona", email: "ona@taxirank.co.za", fullName: "Ona", role: "admin", createdAt: new Date().toISOString() },
    { uid: "admin-louisa", email: "louisa@taxirank.co.za", fullName: "Louisa", role: "admin", createdAt: new Date().toISOString() }
  ];

  const seedMarshals = [
    { marshalId: "marshal-sizwe", fullName: "Sizwe Ngcobo", cellNumber: "0829876543", rankName: "Bree Street Taxi Rank", isActive: true, createdAt: new Date().toISOString() },
    { marshalId: "marshal-lerato", fullName: "Lerato Mokoena", cellNumber: "0834567890", rankName: "KwaMashu Taxi Rank", isActive: true, createdAt: new Date().toISOString() }
  ];

  const seedOwners = [
    { ownerId: "owner-thabo", fullName: "Thabo Mokoena", cellNumber: "0821234567", rankName: "Bree Street Taxi Rank", totalRides: 0, totalRevenue: 0, createdAt: new Date().toISOString() },
    { ownerId: "owner-nomsa", fullName: "Nomsa Zwane", cellNumber: "0837654321", rankName: "KwaMashu Taxi Rank", totalRides: 0, totalRevenue: 0, createdAt: new Date().toISOString() },
    { ownerId: "owner-sipho", fullName: "Sipho Dlamini", cellNumber: "0719876543", rankName: "Bellville Taxi Rank", totalRides: 0, totalRevenue: 0, createdAt: new Date().toISOString() },
    { ownerId: "owner-zanele", fullName: "Zanele Nkosi", cellNumber: "0723456789", rankName: "Bloemfontein Taxi Rank", totalRides: 0, totalRevenue: 0, createdAt: new Date().toISOString() },
    { ownerId: "owner-bheki", fullName: "Bheki Khumalo", cellNumber: "0736547890", rankName: "Bree Street Taxi Rank", totalRides: 0, totalRevenue: 0, createdAt: new Date().toISOString() }
  ];

  // Populate Users Collection based on admins, marshals, owners
  const seedUsers = [];
  seedAdmins.forEach(a => {
    seedUsers.push({
      uid: a.uid,
      email: a.email,
      role: "admin",
      fullName: a.fullName,
      cellNumber: "0000000000",
      isActive: true,
      createdAt: a.createdAt,
      password: "Mageza@25" // Plain password for mock Auth
    });
  });

  seedMarshals.forEach(m => {
    seedUsers.push({
      uid: m.marshalId,
      email: `${m.fullName.toLowerCase().replace(" ", "")}@taxirank.co.za`,
      role: "marshal",
      fullName: m.fullName,
      cellNumber: m.cellNumber,
      rankName: m.rankName,
      isActive: true,
      createdAt: m.createdAt,
      password: "Mageza@25"
    });
  });

  seedOwners.forEach(o => {
    seedUsers.push({
      uid: o.ownerId,
      email: `${o.fullName.toLowerCase().replace(" ", "")}@taxirank.co.za`,
      role: "owner",
      fullName: o.fullName,
      cellNumber: o.cellNumber,
      rankName: o.rankName,
      isActive: true,
      createdAt: o.createdAt,
      password: "Mageza@25"
    });
  });

  // Pre-load 5 owners x 10 taxis = 50 total taxis
  const seedTaxis = [];
  const seedDrivers = [];
  let taxiCounter = 1;

  const namesSA = [
    "Lwazi", "Sipho", "Muzi", "Thabo", "Bandile", "Mandla", "Nkosana", "Kabelo", "Sifiso", "Jabulani",
    "Bongani", "Lungelo", "Sandile", "Khaya", "Themba", "Zweli", "Senzo", "Nhlanhla", "Dumisani", "Mthokozisi",
    "Bheki", "Sfiso", "Tshepo", "Katlego", "Lefa", "Mpho", "Sello", "Pule", "Rethabile", "Molefe",
    "Kgotso", "Lebogang", "Ofentse", "Koketso", "Thabang", "Lesedi", "Tumi", "Nkululeko", "Muzi", "Simphiwe",
    "Sanele", "Sphelele", "Mxolisi", "Melusi", "Vusi", "Zola", "Sizwe", "Thulani", "Zama", "Xolani"
  ];

  seedOwners.forEach((owner, oIdx) => {
    const rank = seedRanks.find(r => r.rankName === owner.rankName) || seedRanks[0];
    for (let i = 1; i <= 10; i++) {
      const taxiId = `taxi-${taxiCounter}`;
      const driverId = `driver-${taxiCounter}`;
      const regNumber = `${owner.fullName.substring(0, 3).toUpperCase()} ${100 + i} ${rank.province === "Gauteng" ? "GP" : rank.province === "KwaZulu-Natal" ? "ZN" : rank.province === "Western Cape" ? "WP" : "FS"}`;
      const driverName = `${namesSA[taxiCounter - 1]} Dlamini`;
      const driverCell = `07${Math.floor(10000000 + Math.random() * 90000000)}`;

      seedTaxis.push({
        taxiId,
        registrationNumber: regNumber,
        ownerId: owner.ownerId,
        ownerName: owner.fullName,
        driverName,
        driverCell,
        capacity: 15,
        rankName: rank.rankName,
        rankId: rank.rankId,
        fare: 25.0,
        isAvailable: true,
        totalRides: Math.floor(Math.random() * 50) + 10,
        totalEarnings: 0, // Calculated below
        createdAt: new Date().toISOString()
      });

      // Calculate total earnings based on total rides
      const taxiRef = seedTaxis[seedTaxis.length - 1];
      taxiRef.totalEarnings = taxiRef.totalRides * taxiRef.fare;

      // Update owner stats
      owner.totalRides += taxiRef.totalRides;
      owner.totalRevenue += taxiRef.totalEarnings;

      seedDrivers.push({
        driverId,
        fullName: driverName,
        cellNumber: driverCell,
        taxiId,
        taxiRegistration: regNumber,
        ownerName: owner.fullName,
        rankName: rank.rankName,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      taxiCounter++;
    }
  });

  const seedQueues = [];
  const seedRides = [];
  const seedReviews = [
    {
      reviewId: "rev-1",
      userId: "pass-1",
      userRole: "passenger",
      userName: "Naledi Mphela",
      rating: 5,
      comment: "Bree Street Rank queue moves fast now. Great system!",
      rankName: "Bree Street Taxi Rank",
      createdAt: new Date().toISOString()
    },
    {
      reviewId: "rev-2",
      userId: "pass-2",
      userRole: "passenger",
      userName: "Junior Khumalo",
      rating: 4,
      comment: "Safe driving from KwaMashu, highly recommended.",
      rankName: "KwaMashu Taxi Rank",
      createdAt: new Date().toISOString()
    }
  ];

  const seedNews = [
    {
      newsId: "news-1",
      title: "Fare adjustment starting August 1st",
      content: "Due to fuel price increases, local fares will increase by R2 across all ranks.",
      type: "price_increase",
      author: "Siya",
      priority: "high",
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      newsId: "news-2",
      title: "Bree Street Rank fully operational",
      content: "All queues are operating normally. No disturbances reported.",
      type: "general",
      author: "Sizwe Ngcobo",
      priority: "low",
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const seedQRCodes = seedRanks.map(r => ({
    qrId: `qr-${r.rankId}`,
    rankName: r.rankName,
    rankId: r.rankId,
    qrCodeImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // Base64 encoded 1px dot
    isActive: true,
    createdAt: new Date().toISOString()
  }));

  global.mockDatabase = {
    ranks: seedRanks,
    admins: seedAdmins,
    marshals: seedMarshals,
    owners: seedOwners,
    users: seedUsers,
    taxis: seedTaxis,
    drivers: seedDrivers,
    passengers: [
      { passengerId: "pass-1", fullName: "Naledi Mphela", cellNumber: "0711122334", email: "naledi@gmail.com", rideHistory: [], createdAt: new Date().toISOString() }
    ],
    queues: seedQueues,
    rides: seedRides,
    reviews: seedReviews,
    news: seedNews,
    qrCodes: seedQRCodes
  };
}

export const mockDb = {
  get: (collection) => {
    return global.mockDatabase[collection] || [];
  },
  find: (collection, filterFn) => {
    return (global.mockDatabase[collection] || []).filter(filterFn);
  },
  findOne: (collection, filterFn) => {
    return (global.mockDatabase[collection] || []).find(filterFn);
  },
  insert: (collection, document) => {
    if (!global.mockDatabase[collection]) {
      global.mockDatabase[collection] = [];
    }
    global.mockDatabase[collection].push(document);
    return document;
  },
  update: (collection, filterFn, updateObj) => {
    const list = global.mockDatabase[collection] || [];
    let updatedCount = 0;
    list.forEach(item => {
      if (filterFn(item)) {
        Object.assign(item, updateObj);
        updatedCount++;
      }
    });
    return updatedCount;
  },
  delete: (collection, filterFn) => {
    const list = global.mockDatabase[collection] || [];
    const beforeLength = list.length;
    global.mockDatabase[collection] = list.filter(item => !filterFn(item));
    return beforeLength - global.mockDatabase[collection].length;
  }
};
