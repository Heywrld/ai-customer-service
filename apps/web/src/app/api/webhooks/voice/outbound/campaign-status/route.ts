import { NextRequest, NextResponse } from "next/server";
import { db } from "@han/database";

// Twilio posts here when a campaign call status changes.
// Query param: ?callId=campaignCallId
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const callStatus = params.get("CallStatus") ?? "";
  const callId = req.nextUrl.searchParams.get("callId") ?? "";

  if (!callId) return new NextResponse("", { status: 200 });

  const callRecord = await db.campaignCall
    .findUnique({ where: { id: callId } })
    .catch(() => null);

  if (!callRecord) return new NextResponse("", { status: 200 });

  // Map Twilio status to our status
  const answered = callStatus === "completed";
  const failed = ["no-answer", "busy", "failed", "canceled"].includes(callStatus);

  if (answered || failed) {
    const newStatus = answered ? "answered" : callStatus as string;

    await db.campaignCall.update({
      where: { id: callId },
      data: { status: newStatus },
    }).catch(console.error);

    // Increment campaign counters
    await db.campaign.update({
      where: { id: callRecord.campaignId },
      data: answered
        ? { sentCalls: { increment: 1 } }
        : { failedCalls: { increment: 1 } },
    }).catch(console.error);
  }

  console.log(`[Campaign/Status] callId=${callId} status=${callStatus}`);
  return new NextResponse("", { status: 200 });
}
