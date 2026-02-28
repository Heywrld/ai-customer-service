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

// Called by Twilio when a customer calls the business phone number.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  const to = params.get("To") ?? "";
  console.log("[Voice] Incoming call To:", to);

  await db.$connect().catch(() => {});

  const business = await db.business.findFirst({
    where: { phoneNumber: to, isActive: true },
  }).catch((err) => { console.error("[Voice] DB lookup error:", err); return null; });

  console.log("[Voice] Business found:", business?.name ?? "NONE");

  const businessName = business?.name ?? "this business";
  const voiceId = business?.voiceId ?? DEFAULT_VOICE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const greetingText = `Hello! Thank you for calling ${businessName}. How can I help you today?`;
  const greetingUrl = buildTtsUrl(baseUrl, greetingText, voiceId);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${greetingUrl}</Play>
  <Gather input="speech" action="${baseUrl}/api/webhooks/voice/gather" method="POST"
    speechTimeout="auto" language="en-US" timeout="5">
  </Gather>
  <Say>I didn't catch that. Please call back and try again. Goodbye!</Say>
</Response>`;

  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
