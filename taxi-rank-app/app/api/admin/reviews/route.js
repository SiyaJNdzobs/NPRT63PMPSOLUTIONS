import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const reviewsSnap = await db.collection("reviews").get();
    const reviews = reviewsSnap.docs.map(doc => doc.data());
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Admin reviews error:", error);
    return NextResponse.json({ error: error.message || "Failed to load reviews" }, { status: 500 });
  }
}

