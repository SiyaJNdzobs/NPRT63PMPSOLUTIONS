import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { rideId } = await request.json();
    if (!rideId) {
      return NextResponse.json({ error: "Ride ID is required" }, { status: 400 });
    }
    const shareableLink = `https://e-rank.co.za/track/${rideId}`;
    return NextResponse.json({ shareableLink });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

