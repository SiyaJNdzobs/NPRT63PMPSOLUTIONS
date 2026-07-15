// Self-contained Mock Database for Expo Mobile App
export const mockDatabase = {
  ranks: [
    { rankId: "rank-bree", rankName: "Bree Street Taxi Rank", city: "Johannesburg", province: "Gauteng" },
    { rankId: "rank-kwamashu", rankName: "KwaMashu Taxi Rank", city: "Durban", province: "KwaZulu-Natal" },
    { rankId: "rank-bellville", rankName: "Bellville Taxi Rank", city: "Cape Town", province: "Western Cape" },
    { rankId: "rank-bloemfontein", rankName: "Bloemfontein Taxi Rank", city: "Bloemfontein", province: "Free State" },
    { rankId: "rank-kimberley", rankName: "Kimberley CBD Rank", city: "Kimberley", province: "Northern Cape" }
  ],
  users: [
    // Pre-seeded Admin siyajndzobs@gmail.com with cell number 0820000001
    { cellNumber: "0820000001", password: "Sasingenje@25", fullName: "Siya J", role: "admin", email: "siyajndzobs@gmail.com", rankName: "" },
    // Pre-seeded Marshals
    { cellNumber: "0829876543", password: "Mageza@25", fullName: "Sizwe Ngcobo", role: "marshal", rankName: "Bree Street Taxi Rank" },
    { cellNumber: "0834567890", password: "Mageza@25", fullName: "Lerato Mokoena", role: "marshal", rankName: "KwaMashu Taxi Rank" },
    // Pre-seeded Owners
    { cellNumber: "0821234567", password: "Mageza@25", fullName: "Thabo Mokoena", role: "owner", rankName: "Bree Street Taxi Rank" },
    { cellNumber: "0837654321", password: "Mageza@25", fullName: "Nomsa Zwane", role: "owner", rankName: "KwaMashu Taxi Rank" },
    // Seed Passenger
    { cellNumber: "0711122334", password: "Mageza@25", fullName: "Naledi Mphela", role: "passenger", rankName: "" }
  ],
  taxis: [
    { taxiId: "taxi-1", registrationNumber: "THA 101 GP", ownerName: "Thabo Mokoena", driverName: "Lwazi Dlamini", driverCell: "0720000001", capacity: 15, rankName: "Bree Street Taxi Rank", isAvailable: true, totalRides: 42, fare: 25 },
    { taxiId: "taxi-2", registrationNumber: "THA 102 GP", ownerName: "Thabo Mokoena", driverName: "Sipho Dlamini", driverCell: "0720000002", capacity: 15, rankName: "Bree Street Taxi Rank", isAvailable: true, totalRides: 28, fare: 25 },
    { taxiId: "taxi-3", registrationNumber: "NOM 101 ZN", ownerName: "Nomsa Zwane", driverName: "Muzi Dlamini", driverCell: "0730000001", capacity: 15, rankName: "KwaMashu Taxi Rank", isAvailable: true, totalRides: 31, fare: 30 }
  ],
  queues: [
    { queueId: "q-1", taxiId: "taxi-1", rankId: "rank-bree", rankName: "Bree Street Taxi Rank", driverName: "Lwazi Dlamini", queuePosition: 1, status: "waiting", joinedAt: new Date().toISOString() }
  ],
  rides: [],
  news: [
    { newsId: "news-1", title: "Fare adjustment starting August 1st", content: "Due to fuel price increases, local fares will increase by R2 across all ranks.", type: "price_increase", priority: "high", createdAt: new Date().toLocaleDateString() },
    { newsId: "news-2", title: "Kimberley CBD Rank fully operational", content: "All queues are operating normally. No disturbances reported.", type: "general", priority: "low", createdAt: new Date().toLocaleDateString() }
  ],
  reviews: [
    { reviewId: "rev-1", userName: "Naledi Mphela", rating: 5, comment: "Bree Street Rank queue moves fast now. Great system!", rankName: "Bree Street Taxi Rank" }
  ]
};
