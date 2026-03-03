import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@han/database";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

function buildTtsUrl(baseUrl: string, text: string, voiceId: string): string {
  const ts = Date.now().toString();
  const t = Buffer.from(text).toString("base64url");
  const sig = createHmac("sha256", process.env.CLERK_SECRET_KEY ?? "han-tts-secret")
    .update(`${t}:${voiceId}:${ts}`)
    .digest("hex");
  const p = Buffer.from(JSON.stringify({ t, v: voiceId, ts, sig })).toString("base64url");
  return `${baseUrl}/api/tts?p=${p}`;
}

function twiml(xml: string): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${xml}\n</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

// TwiML endpoint for all outbound call types.
// Query params:
//   businessPhone — the Han pool number (identifies the business)
//   type          — "callback" | "campaign" | "scheduled"
//   message       — URL-encoded message text (for campaign/scheduled)
export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const businessPhone = searchParams.get("businessPhone") ?? "";
  const type = searchParams.get("type") ?? "callback";
  const rawMessage = searchParams.get("message") ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const business = await db.business
    .findFirst({ where: { phoneNumber: businessPhone } })
    .catch(() => null);

  const voiceId = business?.voiceId ?? DEFAULT_VOICE_ID;
  const businessName = business?.name ?? "the business";

  // ── Missed call callback — play greeting + open AI conversation ─────────────
  if (type === "callback") {
    const greetingText =
      `Hello! You called ${businessName} a moment ago and we missed you. ` +
      `We're calling you back now. How can we help you today?`;
    const ttsUrl = buildTtsUrl(baseUrl, greetingText, voiceId);
    const gatherAction =
      `${baseUrl}/api/webhooks/voice/gather` +
      `?businessPhone=${encodeURIComponent(businessPhone)}`;

    return twiml(
      `  <Play>${ttsUrl}</Play>\n` +
      `  <Gather input="speech" action="${gatherAction}" method="POST"\n` +
      `    timeout="5" speechTimeout="auto" language="en-NG">\n  </Gather>\n` +
      `  <Hangup/>`
    );
  }

  // ── Campaign or scheduled — play message + hangup (one-way) ─────────────────
  const message = decodeURIComponent(rawMessage);
  if (!message) {
    return twiml(`  <Hangup/>`);
  }

  const ttsUrl = buildTtsUrl(baseUrl, message, voiceId);
  return twiml(`  <Play>${ttsUrl}</Play>\n  <Hangup/>`);
}
