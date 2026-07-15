import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { fullName, email, cellNumber, password, role, adminCode, rankName } = await request.json();

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanRole = role.toLowerCase();

    // 1. Admin registration restriction
    if (cleanRole === "admin") {
      if (adminCode !== "7391") {
        return NextResponse.json({ error: "Invalid admin secret code" }, { status: 400 });
      }
    }

    // 2. Check if user already exists
    let existingUser = null;
    try {
      existingUser = await auth.getUserByEmail(email);
    } catch (e) {
      // User doesn't exist, which is fine
    }

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // 3. Create user in authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    const uid = userRecord.uid;

    // 4. Save to Firestore 'users' collection
    const userData = {
      uid,
      email,
      role: cleanRole,
      fullName,
      cellNumber: cellNumber || "",
      rankName: rankName || "",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await db.collection("users").doc(uid).set(userData);

    // 5. Save to role-specific collections
    if (cleanRole === "admin") {
      await db.collection("admins").doc(uid).set({
        uid,
        email,
        fullName,
        role: "admin",
        createdAt: new Date().toISOString(),
      });
    } else if (cleanRole === "marshal") {
      await db.collection("marshals").doc(uid).set({
        marshalId: uid,
        fullName,
        cellNumber: cellNumber || "",
        rankName: rankName || "",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    } else if (cleanRole === "owner") {
      await db.collection("owners").doc(uid).set({
        ownerId: uid,
        fullName,
        cellNumber: cellNumber || "",
        rankName: rankName || "",
        totalRides: 0,
        totalRevenue: 0,
        createdAt: new Date().toISOString(),
      });
    } else if (cleanRole === "passenger") {
      await db.collection("passengers").doc(uid).set({
        passengerId: uid,
        fullName,
        cellNumber: cellNumber || "",
        email,
        rideHistory: [],
        createdAt: new Date().toISOString(),
      });
    }

    // Generate mock token or firebase token
    const token = `mock-token-${uid}-${cleanRole}`;

    return NextResponse.json({
      token,
      role: cleanRole,
      fullName,
      email,
      cellNumber,
      rankName,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}

