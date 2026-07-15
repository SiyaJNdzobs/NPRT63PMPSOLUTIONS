import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { rankId } = await request.json();

    if (!rankId) {
      return NextResponse.json({ error: "Rank ID is required" }, { status: 400 });
    }

    const rankSnap = await db.collection("ranks").doc(rankId).get();
    if (!rankSnap.exists) {
      return NextResponse.json({ error: "Rank not found" }, { status: 404 });
    }
    const rankData = rankSnap.data();

    // Check if QR code already exists for this rank
    const existingSnap = await db.collection("qrCodes").where("rankId", "==", rankId).get();
    if (!existingSnap.empty) {
      return NextResponse.json({
        message: "QR code already exists for this rank",
        qrCode: existingSnap.docs[0].data()
      });
    }

    const qrId = `qr-${rankId}`;
    const newQR = {
      qrId,
      rankName: rankData.rankName,
      rankId,
      qrCodeImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // Base64 placeholder
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await db.collection("qrCodes").doc(qrId).set(newQR);

    return NextResponse.json({ message: "QR code generated successfully", qrCode: newQR });
  } catch (error) {
    console.error("Generate QR code error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate QR code" }, { status: 500 });
  }
}

