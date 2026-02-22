import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";
import { purchaseNumber } from "@han/voice";

// POST /api/numbers/purchase
// Body: { phoneNumber: "+234..." }
// Buys the number from Twilio, wires the webhook, saves to business
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phoneNumber } = await req.json() as { phoneNumber?: string };
  if (!phoneNumber) {
    return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
  }

  const business = await db.business.findFirst({
    where: { clerkUserId: userId },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Don't allow purchasing a second Han-managed number without releasing the first
  if (business.phoneNumberProvider === "han_twilio" && business.phoneNumberSid) {
    return NextResponse.json(
      { error: "You already have a Han-managed number. Release it first in Settings." },
      { status: 409 }
    );
  }

  const webhookBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    req.nextUrl.origin;

  try {
    const purchased = await purchaseNumber(phoneNumber, webhookBaseUrl);

    await db.business.update({
      where: { id: business.id },
      data: {
        phoneNumber: purchased.phoneNumber,
        phoneNumberProvider: "han_twilio",
        phoneNumberSid: purchased.sid,
      },
    });

    return NextResponse.json({
      phoneNumber: purchased.phoneNumber,
      friendlyName: purchased.friendlyName,
      sid: purchased.sid,
    });
  } catch (err) {
    console.error("[Numbers] Purchase failed:", err);
    return NextResponse.json({ error: "Failed to purchase number. Please try again." }, { status: 500 });
  }
}
