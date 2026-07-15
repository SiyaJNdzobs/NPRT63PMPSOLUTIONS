import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { qrId, driverCell } = await request.json();

    if (!qrId || !driverCell) {
      return NextResponse.json({ error: "QR Code ID and Driver Cell Number are required" }, { status: 400 });
    }

    // 1. Fetch QR code to get Rank
    const qrSnap = await db.collection("qrCodes").doc(qrId).get();
    if (!qrSnap.exists) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
    }
    const qrData = qrSnap.data();
    const { rankId, rankName } = qrData;

    // 2. Fetch Driver by Cell Number
    const driverSnap = await db.collection("drivers").where("cellNumber", "==", driverCell).get();
    if (driverSnap.empty) {
      return NextResponse.json({ error: "Driver profile not found for this cell number" }, { status: 404 });
    }
    const driverData = driverSnap.docs[0].data();
    const { driverId, taxiId, fullName } = driverData;

    if (!taxiId) {
      return NextResponse.json({ error: "Driver does not have an assigned taxi" }, { status: 400 });
    }

    // Check if taxi is already in the queue for this rank
    const existingQueueSnap = await db.collection("queues")
      .where("taxiId", "==", taxiId)
      .where("status", "==", "waiting")
      .get();

    if (!existingQueueSnap.empty) {
      return NextResponse.json({
        message: "Driver is already in the queue",
        queue: existingQueueSnap.docs[0].data()
      });
    }

    // 3. Calculate queue position
    const rankQueueSnap = await db.collection("queues")
      .where("rankId", "==", rankId)
      .where("status", "==", "waiting")
      .get();
    const position = rankQueueSnap.size + 1;

    // 4. Join Queue
    const queueId = `queue-${Math.random().toString(36).substr(2, 9)}`;
    const newQueueEntry = {
      queueId,
      taxiId,
      rankId,
      rankName,
      driverId,
      driverName: fullName,
      queuePosition: position,
      status: "waiting",
      joinedAt: new Date().toISOString(),
      completedAt: null
    };

    await db.collection("queues").doc(queueId).set(newQueueEntry);

    return NextResponse.json({
      message: "Successfully joined taxi queue",
      queue: newQueueEntry
    });
  } catch (error) {
    console.error("Scan QR code error:", error);
    return NextResponse.json({ error: error.message || "Failed to scan QR code" }, { status: 500 });
  }
}

