import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const taxisSnap = await db.collection("taxis").get();
    let totalTaxis = taxisSnap.size;
    let totalRides = 0;
    let totalRevenue = 0;

    taxisSnap.docs.forEach(doc => {
      const data = doc.data();
      totalRides += Number(data.totalRides || 0);
      totalRevenue += Number(data.totalEarnings || 0);
    });

    const marshalsSnap = await db.collection("marshals").get();
    const ownersSnap = await db.collection("owners").get();
    const passengersSnap = await db.collection("passengers").get();

    return NextResponse.json({
      totalTaxis,
      totalRides,
      totalRevenue,
      totalMarshals: marshalsSnap.size,
      totalOwners: ownersSnap.size,
      totalPassengers: passengersSnap.size
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message || "Failed to load admin stats" }, { status: 500 });
  }
}

