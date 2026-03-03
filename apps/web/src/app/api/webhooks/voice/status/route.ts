import { NextRequest, NextResponse } from "next/server";
import { db } from "@han/database";
import { makeCall } from "@han/voice";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

// Called by Twilio when a call status changes (ringing, in-progress, completed, no-answer, busy, failed).
// 1. On "completed" → mark voice conversation as resolved.
// 2. On "no-answer" | "busy" | "failed" for inbound calls → trigger callback if business has it enabled.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const callStatus = params.get("CallStatus") ?? "";
  const to = params.get("To") ?? "";
  const from = params.get("From") ?? "";
  const direction = params.get("Direction") ?? ""; // "inbound" | "outbound-api"

  console.log(`[Voice/Status] CallStatus=${callStatus} Direction=${direction} To=${to} From=${from}`);

  // ── Mark conversation resolved when call completes ──────────────────────────
  if (callStatus === "completed" && to && from) {
    // For inbound: To = Han number, From = customer
    // For outbound: To = customer, From = Han number — look up by From
    const hanNumber = direction === "outbound-api" ? from : to;
    const customerNumber = direction === "outbound-api" ? to : from;

    const business = await db.business
      .findFirst({ where: { phoneNumber: hanNumber } })
      .catch(() => null);

    if (business) {
      const customer = await db.customer
        .findFirst({ where: { businessId: business.id, phoneNumber: customerNumber } })
        .catch(() => null);

      if (customer) {
        await db.conversation.updateMany({
          where: {
            businessId: business.id,
            customerId: customer.id,
            channel: "voice",
            status: "active",
          },
          data: { status: "resolved", resolvedAt: new Date() },
        }).catch(console.error);
      }
    }
  }

  // ── Missed call callback ────────────────────────────────────────────────────
  // Only trigger for inbound calls that were missed (not outbound call failures)
  const isMissed = ["no-answer", "busy", "failed"].includes(callStatus);
  if (isMissed && direction !== "outbound-api" && to && from) {
    const business = await db.business
      .findFirst({ where: { phoneNumber: to, isActive: true } })
      .catch(() => null);

    if (business?.missedCallCallback) {
      const twimlUrl =
        `${baseUrl}/api/webhooks/voice/outbound` +
        `?businessPhone=${encodeURIComponent(to)}&type=callback`;
      const statusUrl = `${baseUrl}/api/webhooks/voice/status`;

      console.log(`[Voice/Status] Missed call from ${from} — triggering callback`);
      await makeCall(from, to, twimlUrl, statusUrl).catch((err) =>
        console.error("[Voice/Status] Callback failed:", err)
      );
    }
  }

  return new NextResponse("", { status: 200 });
}
