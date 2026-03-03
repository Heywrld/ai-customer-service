import { NextRequest, NextResponse } from "next/server";
import { db } from "@han/database";
import { makeCall } from "@han/voice";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

// GET /api/cron/process-calls
// Called by Vercel Cron every minute.
// Fires any scheduled calls that are due.
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized invocations
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // Find pending calls that are due (up to 20 per tick to stay within timeout)
  const dueCalls = await db.scheduledCall.findMany({
    where: { scheduledAt: { lte: now }, status: "pending" },
    include: {
      business: { select: { phoneNumber: true, voiceId: true } },
    },
    take: 20,
    orderBy: { scheduledAt: "asc" },
  });

  let processed = 0;
  let failed = 0;

  for (const call of dueCalls) {
    const hanNumber = call.business.phoneNumber;
    if (!hanNumber) {
      await db.scheduledCall.update({ where: { id: call.id }, data: { status: "failed" } }).catch(() => null);
      failed++;
      continue;
    }

    const twimlUrl =
      `${baseUrl}/api/webhooks/voice/outbound` +
      `?businessPhone=${encodeURIComponent(hanNumber)}&type=scheduled` +
      `&message=${encodeURIComponent(call.message)}`;
    const statusUrl = `${baseUrl}/api/webhooks/voice/status`;

    const sid = await makeCall(call.phoneNumber, hanNumber, twimlUrl, statusUrl).catch(
      (err) => { console.error(`[Cron] Failed to call ${call.phoneNumber}:`, err); return null; }
    );

    await db.scheduledCall.update({
      where: { id: call.id },
      data: {
        status: sid ? "sent" : "failed",
        twilioCallSid: sid ?? undefined,
      },
    }).catch(() => null);

    if (sid) processed++;
    else failed++;
  }

  console.log(`[Cron/process-calls] processed=${processed} failed=${failed}`);
  return NextResponse.json({ processed, failed });
}
