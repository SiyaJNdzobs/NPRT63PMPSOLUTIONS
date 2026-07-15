import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { rankId } = resolvedParams;

    const qrSnap = await db.collection("qrCodes").where("rankId", "==", rankId).get();
    if (qrSnap.empty) {
      return NextResponse.json({ error: "QR code not found for this rank" }, { status: 404 });
    }

    return NextResponse.json(qrSnap.docs[0].data());
  } catch (error) {
    console.error("Get QR code error:", error);
    return NextResponse.json({ error: error.message || "Failed to load QR code" }, { status: 500 });
  }
}
