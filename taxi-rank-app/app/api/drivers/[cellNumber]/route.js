import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { cellNumber } = resolvedParams;

    const driversSnap = await db.collection("drivers").where("cellNumber", "==", cellNumber).get();
    if (driversSnap.empty) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 });
    }
    const driverData = driversSnap.docs[0].data();

    let taxiData = null;
    if (driverData.taxiId) {
      const taxiSnap = await db.collection("taxis").doc(driverData.taxiId).get();
      if (taxiSnap.exists) taxiData = taxiSnap.data();
    }

    let queueData = null;
    if (driverData.taxiId) {
      const queueSnap = await db.collection("queues")
        .where("taxiId", "==", driverData.taxiId)
        .where("status", "==", "waiting")
        .get();
      if (!queueSnap.empty) queueData = queueSnap.docs[0].data();
    }

    let activeRide = null;
    if (driverData.taxiId) {
      const rideSnap = await db.collection("rides")
        .where("taxiId", "==", driverData.taxiId)
        .where("status", "==", "in-progress")
        .get();
      if (!rideSnap.empty) activeRide = rideSnap.docs[0].data();
    }

    return NextResponse.json({ driver: driverData, taxi: taxiData, queue: queueData, activeRide });
  } catch (error) {
    console.error("Get driver data error:", error);
    return NextResponse.json({ error: error.message || "Failed to load driver profile" }, { status: 500 });
  }
}
