/**
 * E-Rank API Test Script
 * Run with: node test-endpoints.js
 * Requires the dev server to be running (npm run dev)
 */

const BASE = "http://localhost:3000/api";

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASS" });
    passed++;
    console.log(`  ✅  ${name}`);
  } catch (err) {
    results.push({ name, status: "FAIL", error: err.message });
    failed++;
    console.log(`  ❌  ${name} → ${err.message}`);
  }
}

function expect(val, condition, msg) {
  if (!condition(val)) {
    throw new Error(msg || `Expected condition failed, got: ${JSON.stringify(val)}`);
  }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function runTests() {
  console.log("\n=== E-Rank API Test Suite ===\n");

  // ── RANKS ────────────────────────────────────────────────────────────────
  console.log("\n[Ranks]\n");

  let rank1;
  await test("GET /api/ranks - returns array of ranks", async () => {
    const { status, data } = await get("/ranks");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
    expect(data.length, v => v > 0, "Expected at least 1 rank");
    rank1 = data[0];
  });

  // ── AUTH ─────────────────────────────────────────────────────────────────
  console.log("\n[Auth]\n");

  const testEmail = `testuser_${Date.now()}@erank.co.za`;
  let registeredToken;

  await test("POST /api/auth/register - passenger registration", async () => {
    const { status, data } = await post("/auth/register", {
      fullName: "Test Passenger",
      email: testEmail,
      cellNumber: "0799999999",
      password: "Test@1234",
      role: "passenger",
    });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.token, v => !!v, "Expected token in response");
    expect(data.role, v => v === "passenger", `Expected role passenger, got ${data.role}`);
    registeredToken = data.token;
  });

  await test("POST /api/auth/login - login with registered user", async () => {
    const { status, data } = await post("/auth/login", {
      email: testEmail,
      password: "Test@1234",
    });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.token, v => !!v, "Expected token");
    expect(data.role, v => v === "passenger", `Expected passenger role`);
  });

  await test("POST /api/auth/register - rejects duplicate email", async () => {
    const { status, data } = await post("/auth/register", {
      fullName: "Duplicate User",
      email: testEmail,
      cellNumber: "0799999998",
      password: "Test@1234",
      role: "passenger",
    });
    expect(status, v => v === 400, `Expected 400, got ${status}`);
  });

  await test("POST /api/auth/register - rejects invalid admin code", async () => {
    const { status } = await post("/auth/register", {
      fullName: "Fake Admin",
      email: `fakeadmin_${Date.now()}@erank.co.za`,
      cellNumber: "0799999997",
      password: "Test@1234",
      role: "admin",
      adminCode: "0000",
    });
    expect(status, v => v === 400, `Expected 400, got ${status}`);
  });

  await test("POST /api/auth/register - accepts valid admin code", async () => {
    const { status, data } = await post("/auth/register", {
      fullName: "Valid Admin",
      email: `validadmin_${Date.now()}@erank.co.za`,
      cellNumber: "0799999996",
      password: "Test@1234",
      role: "admin",
      adminCode: "7391",
    });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.role, v => v === "admin", `Expected admin role`);
  });

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  console.log("\n[Admin]\n");

  await test("GET /api/admin/stats - returns system stats", async () => {
    const { status, data } = await get("/admin/stats");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data.totalTaxis, v => v !== undefined, "Expected totalTaxis field");
    expect(data.totalRides, v => v !== undefined, "Expected totalRides field");
    expect(data.totalRevenue, v => v !== undefined, "Expected totalRevenue field");
  });

  await test("GET /api/admin/reviews - returns reviews array", async () => {
    const { status, data } = await get("/admin/reviews");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
  });

  await test("GET /api/admin/overview - returns ranks + owners + marshals + taxis", async () => {
    const { status, data } = await get("/admin/overview");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data.ranks, v => Array.isArray(v), "Expected ranks array");
    expect(data.owners, v => Array.isArray(v), "Expected owners array");
    expect(data.taxis, v => Array.isArray(v), "Expected taxis array");
  });

  // ── TAXIS ─────────────────────────────────────────────────────────────────
  console.log("\n[Taxis]\n");

  let newTaxiId;

  await test("POST /api/taxis/add - adds a new taxi", async () => {
    const { status, data } = await post("/taxis/add", {
      registrationNumber: `TEST ${Date.now()} NC`,
      ownerId: "owner-thabo",
      ownerName: "Thabo Mokoena",
      driverName: "Test Driver",
      driverCell: "0811111111",
      capacity: 15,
      rankName: rank1?.rankName,
      rankId: rank1?.rankId,
      fare: 30,
    });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.taxi, v => !!v, "Expected taxi object in response");
    newTaxiId = data.taxi.taxiId;
  });

  await test("GET /api/taxis/owner/[ownerId] - returns taxis for owner", async () => {
    const { status, data } = await get("/taxis/owner/owner-thabo");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
    expect(data.length, v => v > 0, "Expected at least 1 taxi");
  });

  await test("GET /api/taxis/rank/[rankName] - returns taxis for rank", async () => {
    const rankName = encodeURIComponent(rank1?.rankName || "Bree Street Taxi Rank");
    const { status, data } = await get(`/taxis/rank/${rankName}`);
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
  });

  // ── RIDES ─────────────────────────────────────────────────────────────────
  console.log("\n[Rides]\n");

  let newRideId;

  await test("POST /api/rides/start - starts a new ride", async () => {
    const { status, data } = await post("/rides/start", {
      taxiId: newTaxiId,
      fromLocation: rank1?.rankName || "Bree Street Taxi Rank",
      toLocation: "Soweto",
      fare: 30,
      isLongDistance: false,
    });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.ride, v => !!v, "Expected ride object");
    expect(data.ride.status, v => v === "in-progress", `Expected in-progress status`);
    newRideId = data.ride.rideId;
  });

  await test("POST /api/rides/complete - completes a ride", async () => {
    const { status, data } = await post("/rides/complete", { rideId: newRideId });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.ride.status, v => v === "completed", `Expected completed status`);
  });

  await test("POST /api/rides/share - returns shareable link", async () => {
    const { status, data } = await post("/rides/share", { rideId: newRideId });
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data.shareableLink, v => v.includes(newRideId), "Expected link to include ride ID");
  });

  // ── REVIEWS ───────────────────────────────────────────────────────────────
  console.log("\n[Reviews]\n");

  await test("POST /api/reviews/add - submits a review", async () => {
    const { status, data } = await post("/reviews/add", {
      userId: "test-user-1",
      userRole: "passenger",
      userName: "Test Passenger",
      rating: 4,
      comment: "Good service, clean taxis!",
      rankName: rank1?.rankName || "Bree Street Taxi Rank",
    });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.review, v => !!v, "Expected review object");
  });

  await test("GET /api/reviews/all - returns all reviews", async () => {
    const { status, data } = await get("/reviews/all");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
    expect(data.length, v => v > 0, "Expected at least 1 review");
  });

  // ── NEWS ──────────────────────────────────────────────────────────────────
  console.log("\n[News]\n");

  await test("POST /api/news/add - posts a news item", async () => {
    const { status, data } = await post("/news/add", {
      title: "Test Notice: System Operational",
      content: "E-Rank is fully operational for testing.",
      type: "general",
      author: "Test Admin",
      priority: "low",
    });
    expect(status, v => v === 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.news, v => !!v, "Expected news object");
  });

  await test("GET /api/news/all - returns all news", async () => {
    const { status, data } = await get("/news/all");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
  });

  await test("GET /api/news/active - returns active news only", async () => {
    const { status, data } = await get("/news/active");
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
  });

  // ── QR / QUEUE ────────────────────────────────────────────────────────────
  console.log("\n[QR & Queue]\n");

  // Use a seeded driver that belongs to rank-bree (first driver in mock DB)
  let seededDriverCell;
  await test("GET /api/ranks - fetch first rank drivers to find seeded cell", async () => {
    // The mock DB seeds drivers for each rank owner's taxis.
    // We'll look up taxis at rank-bree to grab a driver cell.
    const { status, data } = await get(`/taxis/rank/${encodeURIComponent(rank1?.rankName)}`);
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v) && data.length > 0, "Expected at least 1 taxi");
    seededDriverCell = data[0]?.driverCell || data[0]?.driverCellNumber;
    if (!seededDriverCell) throw new Error(`No driverCell on taxi: ${JSON.stringify(data[0])}`);
  });

  await test("POST /api/qr/scan - driver joins queue", async () => {
    const { status, data } = await post("/qr/scan", {
      qrId: `qr-${rank1?.rankId}`,
      driverCell: seededDriverCell,
    });
    // 200 = joined, or 200 with 'already in queue' message - both valid
    const isOk = status === 200;
    expect(status, v => isOk, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    expect(data.queue, v => !!v, "Expected queue object");
  });

  await test(`GET /api/queues/rank/[rankId] - returns rank queue`, async () => {
    const { status, data } = await get(`/queues/rank/${rank1?.rankId}`);
    expect(status, v => v === 200, `Expected 200, got ${status}`);
    expect(data, v => Array.isArray(v), "Expected array");
    // After QR scan, there should be at least 1 entry
    expect(data.length, v => v > 0, "Expected at least 1 queued taxi after QR scan");
  });

  // ── CLEANUP ───────────────────────────────────────────────────────────────
  if (newTaxiId) {
    await test("DELETE /api/taxis/[taxiId] - removes the taxi", async () => {
      const res = await fetch(`${BASE}/taxis/${newTaxiId}`, { method: "DELETE" });
      const data = await res.json();
      expect(res.status, v => v === 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    });
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log(`  Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("═══════════════════════════════════════\n");

  if (failed > 0) {
    console.log("Failed tests:");
    results.filter(r => r.status === "FAIL").forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log("  🎉 All tests passed!\n");
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
