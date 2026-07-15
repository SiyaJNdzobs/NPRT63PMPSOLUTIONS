import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      registrationNumber,
      ownerId,
      ownerName,
      driverName,
      driverCell,
      capacity,
      rankName,
      rankId,
      fare
    } = data;

    if (!registrationNumber || !ownerId || !driverName || !driverCell || !rankId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const taxiId = `taxi-${Math.random().toString(36).substr(2, 9)}`;
    const driverId = `driver-${Math.random().toString(36).substr(2, 9)}`;

    const newTaxi = {
      taxiId,
      registrationNumber,
      ownerId,
      ownerName: ownerName || "Owner",
      driverName,
      driverCell,
      capacity: Number(capacity || 15),
      rankName: rankName || "Bree Street Taxi Rank",
      rankId,
      fare: Number(fare || 25),
      isAvailable: true,
      totalRides: 0,
      totalEarnings: 0,
      createdAt: new Date().toISOString()
    };

    await db.collection("taxis").doc(taxiId).set(newTaxi);

    // Save driver details as well
    const newDriver = {
      driverId,
      fullName: driverName,
      cellNumber: driverCell,
      taxiId,
      taxiRegistration: registrationNumber,
      ownerName: ownerName || "Owner",
      rankName: rankName || "Bree Street Taxi Rank",
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await db.collection("drivers").doc(driverId).set(newDriver);

    return NextResponse.json({ message: "Taxi added successfully", taxi: newTaxi });
  } catch (error) {
    console.error("Add taxi error:", error);
    return NextResponse.json({ error: error.message || "Failed to add taxi" }, { status: 500 });
  }
}

