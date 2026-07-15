import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { passengerId } = resolvedParams;

    const passengerSnap = await db.collection("passengers").doc(passengerId).get();
    if (!passengerSnap.exists) {
      return NextResponse.json({ error: "Passenger not found" }, { status: 404 });
    }
    const passengerData = passengerSnap.data();
    const cellNumber = passengerData.cellNumber;

    if (!cellNumber) {
      return NextResponse.json([]);
    }

    const ridesSnap = await db.collection("rides").where("passengerCell", "==", cellNumber).get();
    const rides = ridesSnap.docs.map(doc => doc.data());

    return NextResponse.json(rides);
  } catch (error) {
    console.error("Get passenger rides error:", error);
    return NextResponse.json({ error: error.message || "Failed to load passenger rides" }, { status: 500 });
  }
}
