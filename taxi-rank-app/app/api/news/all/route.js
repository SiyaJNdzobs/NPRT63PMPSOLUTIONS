import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const newsSnap = await db.collection("news").get();
    const news = newsSnap.docs.map(doc => doc.data());
    return NextResponse.json(news);
  } catch (error) {
    console.error("Get all news error:", error);
    return NextResponse.json({ error: error.message || "Failed to load news" }, { status: 500 });
  }
}

