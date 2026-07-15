import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const ranksSnap = await db.collection("ranks").get();
    const marshalsSnap = await db.collection("marshals").get();
    const ownersSnap = await db.collection("owners").get();
    const taxisSnap = await db.collection("taxis").get();

    const ranks = ranksSnap.docs.map(doc => doc.data());
    const marshals = marshalsSnap.docs.map(doc => doc.data());
    const owners = ownersSnap.docs.map(doc => doc.data());
    const taxis = taxisSnap.docs.map(doc => doc.data());

    return NextResponse.json({
      ranks,
      marshals,
      owners,
      taxis
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: error.message || "Failed to load overview data" }, { status: 500 });
  }
}

