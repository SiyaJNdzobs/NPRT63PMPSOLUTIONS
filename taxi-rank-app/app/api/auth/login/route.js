import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Query user in Firestore
    const usersSnap = await db.collection("users").where("email", "==", email.toLowerCase()).get();

    if (usersSnap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = usersSnap.docs[0].data();
    const uid = usersSnap.docs[0].id;

    // Verify password (in mock mode we check against the seeded password, or simply mock it)
    if (userData.password && userData.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!userData.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    // Generate mock token
    const token = `mock-token-${uid}-${userData.role}`;

    return NextResponse.json({
      token,
      role: userData.role,
      fullName: userData.fullName,
      email: userData.email,
      cellNumber: userData.cellNumber,
      rankName: userData.rankName,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}

