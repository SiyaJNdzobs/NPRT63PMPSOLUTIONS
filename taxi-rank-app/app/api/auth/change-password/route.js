import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
    }

    const usersSnap = await db.collection("users").where("email", "==", email.toLowerCase()).get();

    if (usersSnap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const uid = usersSnap.docs[0].id;
    await db.collection("users").doc(uid).update({ password: newPassword });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: error.message || "Failed to change password" }, { status: 500 });
  }
}

