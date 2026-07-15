import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const rankName = decodeURIComponent(resolvedParams.rankName);

    const reviewsSnap = await db.collection("reviews").where("rankName", "==", rankName).get();
    const reviews = reviewsSnap.docs.map(doc => doc.data());

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Get rank reviews error:", error);
    return NextResponse.json({ error: error.message || "Failed to load reviews" }, { status: 500 });
  }
}
