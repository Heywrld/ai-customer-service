import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// POST /api/numbers/assign
// Assigns the next available pool number to the authenticated business.
// Called automatically from the Paystack charge.success webhook.
// Safe to call multiple times — no-ops if the business already has a Han pool number.
export async function POST(req: NextRequest) {
  // Support both authenticated (dashboard) and internal (webhook) calls
  let businessId: string | null = null;

  const body = await req.json().catch(() => ({}));

  if (body.businessId) {
    // Internal call from Paystack webhook (passes businessId directly)
    businessId = body.businessId as string;
  } else {
    // Dashboard call — use Clerk session
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const biz = await db.business.findUnique({ where: { clerkUserId: userId } });
    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });
    businessId = biz.id;
  }

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Already has a pool number — nothing to do
  if (business.phoneNumberProvider === "han_pool" && business.phoneNumber) {
    return NextResponse.json({ ok: true, phoneNumber: business.phoneNumber, alreadyAssigned: true });
  }

  // Pick the next available, WhatsApp-ready pool number (FIFO)
  const poolNumber = await db.phoneNumberPool.findFirst({
    where: { assignedBusinessId: null, whatsappReady: true },
    orderBy: { createdAt: "asc" },
  });

  if (!poolNumber) {
    console.error("[Pool] No numbers available in pool for business", businessId);
    return NextResponse.json(
      { error: "No numbers available. Please contact Han support." },
      { status: 503 }
    );
  }

  // Assign atomically
  await db.$transaction([
    db.phoneNumberPool.update({
      where: { id: poolNumber.id },
      data: { assignedBusinessId: business.id, assignedAt: new Date() },
    }),
    db.business.update({
      where: { id: business.id },
      data: {
        phoneNumber: poolNumber.phoneNumber,
        phoneNumberSid: poolNumber.twilioSid,
        phoneNumberProvider: "han_pool",
        whatsappNumber: poolNumber.phoneNumber,
        whatsappProvider: "han_pool",
      },
    }),
  ]);

  console.log(`[Pool] Assigned ${poolNumber.phoneNumber} to business ${business.id} (${business.name})`);

  return NextResponse.json({
    ok: true,
    phoneNumber: poolNumber.phoneNumber,
    alreadyAssigned: false,
  });
}
