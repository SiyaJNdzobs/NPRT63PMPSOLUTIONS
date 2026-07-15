import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const ranksSnap = await db.collection("ranks").get();
    const ranks = ranksSnap.docs.map(doc => doc.data());
    return NextResponse.json(ranks);
  } catch (error) {
    console.error("Get ranks error:", error);
    return NextResponse.json({ error: error.message || "Failed to load ranks" }, { status: 500 });
  }
}

