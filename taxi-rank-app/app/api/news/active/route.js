import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const newsSnap = await db.collection("news").where("isActive", "==", true).get();
    let news = newsSnap.docs.map(doc => doc.data());

    // Filter out expired news
    const now = new Date();
    news = news.filter(item => {
      if (!item.expiresAt) return true;
      return new Date(item.expiresAt) > now;
    });

    return NextResponse.json(news);
  } catch (error) {
    console.error("Get active news error:", error);
    return NextResponse.json({ error: error.message || "Failed to load active news" }, { status: 500 });
  }
}

