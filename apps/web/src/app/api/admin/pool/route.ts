import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";
import { searchAvailableNumbers, purchaseNumber } from "@han/voice";

// Simple admin guard — only the Han admin Clerk user ID can access these routes.
// Set ADMIN_CLERK_USER_ID in your environment to restrict access.
async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminId = process.env.ADMIN_CLERK_USER_ID;
  if (adminId && userId !== adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId };
}

// ─── GET /api/admin/pool — pool status ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const [total, assigned, whatsappReady, available] = await Promise.all([
    db.phoneNumberPool.count(),
    db.phoneNumberPool.count({ where: { assignedBusinessId: { not: null } } }),
    db.phoneNumberPool.count({ where: { whatsappReady: true } }),
    db.phoneNumberPool.count({ where: { assignedBusinessId: null, whatsappReady: true } }),
  ]);

  const numbers = await db.phoneNumberPool.findMany({
    orderBy: { createdAt: "asc" },
    include: { business: { select: { name: true, plan: true } } },
  });

  return NextResponse.json({
    stats: { total, assigned, available, whatsappReady, unregistered: total - whatsappReady },
    numbers,
  });
}

// ─── POST /api/admin/pool — purchase N numbers from Twilio ───────────────────
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { count = 1 } = await req.json();
  if (count < 1 || count > 20) {
    return NextResponse.json({ error: "count must be between 1 and 20" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not set" }, { status: 503 });
  }

  // Find available numbers from Twilio
  const available = await searchAvailableNumbers(count);
  if (available.length === 0) {
    return NextResponse.json({ error: "No Nigerian numbers available from Twilio" }, { status: 503 });
  }

  const purchased = [];
  const errors = [];

  for (const num of available) {
    try {
      const result = await purchaseNumber(num.phoneNumber, baseUrl);
      const poolEntry = await db.phoneNumberPool.create({
        data: {
          phoneNumber: result.phoneNumber,
          twilioSid: result.sid,
          whatsappReady: false,
        },
      });
      purchased.push(poolEntry);
      console.log(`[Admin Pool] Purchased ${result.phoneNumber} (SID: ${result.sid})`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ number: num.phoneNumber, error: message });
      console.error(`[Admin Pool] Failed to purchase ${num.phoneNumber}:`, err);
    }
  }

  return NextResponse.json({
    purchased: purchased.length,
    errors: errors.length,
    numbers: purchased,
    failures: errors,
  });
}
