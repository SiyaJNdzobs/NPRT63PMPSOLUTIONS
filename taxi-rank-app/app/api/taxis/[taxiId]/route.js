import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { taxiId } = resolvedParams;

    await db.collection("taxis").doc(taxiId).delete();

    const driversSnap = await db.collection("drivers").where("taxiId", "==", taxiId).get();
    for (const doc of driversSnap.docs) {
      await db.collection("drivers").doc(doc.id).delete();
    }

    return NextResponse.json({ message: "Taxi and associated driver removed successfully" });
  } catch (error) {
    console.error("Delete taxi error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete taxi" }, { status: 500 });
  }
}
