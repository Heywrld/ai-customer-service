import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminId = process.env.ADMIN_CLERK_USER_ID;
  if (adminId && userId !== adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId };
}

// POST /api/admin/pool/register-whatsapp
// Marks pool numbers as WhatsApp-ready.
//
// For production: before marking as ready, you should manually verify each
// number has been registered as a WhatsApp Business sender via Twilio's
// console (Business → WhatsApp) and the webhook has been configured to
// point at /api/webhooks/whatsapp.
//
// body: { poolIds: string[] }  — array of PhoneNumberPool IDs to mark ready
// OR:   { all: true }          — mark ALL unregistered numbers as ready (use carefully)
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (body.all) {
    // Mark all numbers without a whatsappSid as ready (manual registration was done externally)
    const result = await db.phoneNumberPool.updateMany({
      where: { whatsappReady: false },
      data: {
        whatsappReady: true,
        whatsappSid: `manual-${Date.now()}`, // placeholder for externally registered numbers
      },
    });
    console.log(`[Admin Pool] Marked ${result.count} numbers as WhatsApp-ready`);
    return NextResponse.json({ updated: result.count });
  }

  const poolIds: string[] = body.poolIds ?? [];
  if (!Array.isArray(poolIds) || poolIds.length === 0) {
    return NextResponse.json({ error: "Provide poolIds array or all: true" }, { status: 400 });
  }

  const result = await db.phoneNumberPool.updateMany({
    where: { id: { in: poolIds } },
    data: {
      whatsappReady: true,
      whatsappSid: `manual-${Date.now()}`,
    },
  });

  console.log(`[Admin Pool] Marked ${result.count}/${poolIds.length} numbers as WhatsApp-ready (baseUrl: ${baseUrl})`);

  return NextResponse.json({ updated: result.count });
}
