import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { taxiId } = resolvedParams;
    const { driverName, driverCell } = await request.json();

    if (!driverName || !driverCell) {
      return NextResponse.json({ error: "Driver name and cell number are required" }, { status: 400 });
    }

    await db.collection("taxis").doc(taxiId).update({ driverName, driverCell });

    const driversSnap = await db.collection("drivers").where("cellNumber", "==", driverCell).get();

    if (!driversSnap.empty) {
      const driverDocId = driversSnap.docs[0].id;
      await db.collection("drivers").doc(driverDocId).update({ fullName: driverName, taxiId });
    } else {
      const newDriverId = `driver-${Math.random().toString(36).substr(2, 9)}`;
      const taxiSnap = await db.collection("taxis").doc(taxiId).get();
      const taxiData = taxiSnap.data();

      await db.collection("drivers").doc(newDriverId).set({
        driverId: newDriverId,
        fullName: driverName,
        cellNumber: driverCell,
        taxiId,
        taxiRegistration: taxiData?.registrationNumber || "",
        ownerName: taxiData?.ownerName || "",
        rankName: taxiData?.rankName || "",
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ message: "Driver assigned successfully" });
  } catch (error) {
    console.error("Assign driver error:", error);
    return NextResponse.json({ error: error.message || "Failed to assign driver" }, { status: 500 });
  }
}
