import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { title, content, type, author, priority, expiresAt } = await request.json();

    if (!title || !content || !type || !author || !priority) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newsId = `news-${Math.random().toString(36).substr(2, 9)}`;
    const newNews = {
      newsId,
      title,
      content,
      type,
      author,
      priority,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null
    };

    await db.collection("news").doc(newsId).set(newNews);

    return NextResponse.json({ message: "News item added successfully", news: newNews });
  } catch (error) {
    console.error("Add news error:", error);
    return NextResponse.json({ error: error.message || "Failed to add news" }, { status: 500 });
  }
}

