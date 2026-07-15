import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { userId, userRole, userName, rating, comment, rankName } = await request.json();

    if (!userId || !userName || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanRating = Number(rating);
    if (cleanRating < 1 || cleanRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const reviewId = `rev-${Math.random().toString(36).substr(2, 9)}`;
    const newReview = {
      reviewId,
      userId,
      userRole: userRole || "passenger",
      userName,
      rating: cleanRating,
      comment,
      rankName: rankName || "",
      createdAt: new Date().toISOString()
    };

    await db.collection("reviews").doc(reviewId).set(newReview);

    return NextResponse.json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 500 });
  }
}

