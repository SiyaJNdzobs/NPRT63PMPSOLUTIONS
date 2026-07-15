import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { rankId } = resolvedParams;

    const queuesSnap = await db.collection("queues")
      .where("rankId", "==", rankId)
      .where("status", "==", "waiting")
      .get();

    let queues = queuesSnap.docs.map(doc => doc.data());
    queues.sort((a, b) => a.queuePosition - b.queuePosition);

    return NextResponse.json(queues);
  } catch (error) {
    console.error("Get rank queue error:", error);
    return NextResponse.json({ error: error.message || "Failed to load queues" }, { status: 500 });
  }
}
