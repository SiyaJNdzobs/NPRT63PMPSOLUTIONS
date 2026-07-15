import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { rideId } = await request.json();

    if (!rideId) {
      return NextResponse.json({ error: "Ride ID is required" }, { status: 400 });
    }

    const rideSnap = await db.collection("rides").doc(rideId).get();
    if (!rideSnap.exists) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }
    const rideData = rideSnap.data();

    if (rideData.status === "completed") {
      return NextResponse.json({ message: "Ride is already completed", ride: rideData });
    }

    // 1. Update ride status
    const arrivalTime = new Date().toISOString();
    await db.collection("rides").doc(rideId).update({
      status: "completed",
      arrivalTime
    });

    const updatedRide = { ...rideData, status: "completed", arrivalTime };

    // 2. Make taxi available, increment totalRides and earnings
    const taxiSnap = await db.collection("taxis").doc(rideData.taxiId).get();
    if (taxiSnap.exists) {
      const taxiData = taxiSnap.data();
      const newTotalRides = (taxiData.totalRides || 0) + 1;
      const newTotalEarnings = (taxiData.totalEarnings || 0) + rideData.fare;

      await db.collection("taxis").doc(rideData.taxiId).update({
        isAvailable: true,
        totalRides: newTotalRides,
        totalEarnings: newTotalEarnings
      });

      // 3. Update owner stats
      if (taxiData.ownerId) {
        const ownerSnap = await db.collection("owners").doc(taxiData.ownerId).get();
        if (ownerSnap.exists) {
          const ownerData = ownerSnap.data();
          await db.collection("owners").doc(taxiData.ownerId).update({
            totalRides: (ownerData.totalRides || 0) + 1,
            totalRevenue: (ownerData.totalRevenue || 0) + rideData.fare
          });
        }
      }

      // 4. Log revenue
      const revenueId = `rev-${Math.random().toString(36).substr(2, 9)}`;
      await db.collection("revenues").doc(revenueId).set({
        revenueId,
        ownerId: taxiData.ownerId || "",
        taxiId: rideData.taxiId,
        tripId: rideId,
        amount: rideData.fare,
        recordedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ message: "Ride completed successfully", ride: updatedRide });
  } catch (error) {
    console.error("Complete ride error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete ride" }, { status: 500 });
  }
}

