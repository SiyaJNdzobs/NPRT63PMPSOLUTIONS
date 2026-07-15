import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { ownerId } = resolvedParams;

    const taxisSnap = await db.collection("taxis").where("ownerId", "==", ownerId).get();
    const taxis = taxisSnap.docs.map(doc => doc.data());

    return NextResponse.json(taxis);
  } catch (error) {
    console.error("Get owner taxis error:", error);
    return NextResponse.json({ error: error.message || "Failed to load taxis" }, { status: 500 });
  }
}
