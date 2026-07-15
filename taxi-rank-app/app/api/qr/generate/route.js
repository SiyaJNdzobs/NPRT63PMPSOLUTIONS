import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import QRCode from "qrcode";

export async function POST(request) {
  try {
    const { rankId, rankName, city } = await request.json();

    if (!rankId || !rankName) {
      return NextResponse.json(
        { error: "rankId and rankName are required" },
        { status: 400 }
      );
    }

    // Build the QR payload — a deep-link URL drivers scan to join the queue
    const qrPayload = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/queue/join?rankId=${rankId}&rankName=${encodeURIComponent(rankName)}`;

    // Generate QR code as a base64 PNG
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
      color: {
        dark: "#1e3a5f",  // Navy blue matching the E-Rank brand
        light: "#ffffff",
      },
    });

    const qrId = `qr-${rankId}`;
    const qrDocument = {
      qrId,
      rankId,
      rankName,
      city: city || "",
      qrPayload,
      qrCodeImage: qrCodeDataUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Upsert into the qrCodes collection
    await db.collection("qrCodes").doc(qrId).set(qrDocument);

    return NextResponse.json({
      message: "QR code generated successfully",
      qrCode: qrDocument,
    });
  } catch (error) {
    console.error("QR generate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
