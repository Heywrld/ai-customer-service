import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchAvailableNumbers } from "@han/voice";

// GET /api/numbers/available
// Returns available Nigerian numbers from Twilio for the business to pick from
export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const numbers = await searchAvailableNumbers(6);
    return NextResponse.json({ numbers });
  } catch (err) {
    console.error("[Numbers] Search failed:", err);
    return NextResponse.json({ error: "Failed to fetch available numbers" }, { status: 500 });
  }
}
