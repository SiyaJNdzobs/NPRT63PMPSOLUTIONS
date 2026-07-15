import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const rankName = decodeURIComponent(resolvedParams.rankName);

    const taxisSnap = await db.collection("taxis").where("rankName", "==", rankName).get();
    const taxis = taxisSnap.docs.map(doc => doc.data());

    return NextResponse.json(taxis);
  } catch (error) {
    console.error("Get rank taxis error:", error);
    return NextResponse.json({ error: error.message || "Failed to load taxis" }, { status: 500 });
  }
}
