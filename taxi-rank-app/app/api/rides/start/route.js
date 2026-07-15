import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      taxiId,
      passengerName,
      passengerCell,
      nextOfKinName,
      nextOfKinCell,
      fromLocation,
      toLocation,
      fare,
      isLongDistance
    } = data;

    if (!taxiId || !fromLocation || !toLocation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const taxiSnap = await db.collection("taxis").doc(taxiId).get();
    if (!taxiSnap.exists) {
      return NextResponse.json({ error: "Taxi not found" }, { status: 404 });
    }
    const taxiData = taxiSnap.data();

    const rideId = `ride-${Math.random().toString(36).substr(2, 9)}`;
    const newRide = {
      rideId,
      taxiId,
      taxiRegistration: taxiData.registrationNumber || "",
      driverName: taxiData.driverName || "",
      driverCell: taxiData.driverCell || "",
      passengerName: passengerName || "",
      passengerCell: passengerCell || "",
      nextOfKinName: nextOfKinName || "",
      nextOfKinCell: nextOfKinCell || "",
      fromLocation,
      toLocation,
      fare: Number(fare || taxiData.fare || 25),
      departureTime: new Date().toISOString(),
      arrivalTime: null,
      status: "in-progress",
      isLongDistance: !!isLongDistance,
      shareableLink: `https://e-rank.co.za/track/${rideId}`,
      createdAt: new Date().toISOString()
    };

    await db.collection("rides").doc(rideId).set(newRide);

    // Update taxi availability
    await db.collection("taxis").doc(taxiId).update({
      isAvailable: false
    });

    // If passenger is logged in and cell matches, append to passenger rideHistory
    if (passengerCell) {
      const passengerSnap = await db.collection("passengers").where("cellNumber", "==", passengerCell).get();
      if (!passengerSnap.empty) {
        const passengerId = passengerSnap.docs[0].id;
        const passData = passengerSnap.docs[0].data();
        const history = passData.rideHistory || [];
        history.push(rideId);
        await db.collection("passengers").doc(passengerId).update({ rideHistory: history });
      }
    }

    return NextResponse.json({ message: "Ride started successfully", ride: newRide });
  } catch (error) {
    console.error("Start ride error:", error);
    return NextResponse.json({ error: error.message || "Failed to start ride" }, { status: 500 });
  }
}

