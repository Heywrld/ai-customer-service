import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";
import { releaseNumber } from "@han/voice";

// DELETE /api/numbers/release
// Releases the business's Han-managed Twilio number back to Twilio.
// Called by the business voluntarily (e.g. wants to switch numbers).
// Also called internally by the Paystack webhook on subscription.disable.
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (business.phoneNumberProvider !== "han_twilio" || !business.phoneNumberSid) {
    return NextResponse.json({ error: "No Han-managed number to release" }, { status: 400 });
  }

  await releaseNumber(business.phoneNumberSid);

  await db.business.update({
    where: { id: business.id },
    data: {
      phoneNumber: null,
      phoneNumberSid: null,
      phoneNumberProvider: "byon",
    },
  });

  return NextResponse.json({ ok: true, message: "Number released successfully" });
}
