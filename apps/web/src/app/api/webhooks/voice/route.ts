import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import twilio from "twilio";
import { db } from "@han/database";
import { getPlanStatus } from "@/lib/plan";
import { isBusinessOpen, getBusinessHoursText } from "@/lib/businessHours";

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
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${xml}\n</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

// Called by Twilio when a customer calls a Han pool number.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Validate it's genuinely from Twilio (skip in dev)
  if (process.env.NODE_ENV === "production") {
    const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
    const signature = req.headers.get("x-twilio-signature") ?? "";
    const params: Record<string, string> = {};
    new URLSearchParams(rawBody).forEach((v, k) => { params[k] = v; });
    if (!twilio.validateRequest(authToken, signature, req.url, params)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const params = new URLSearchParams(rawBody);
  const to = params.get("To") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  console.log("[Voice] Incoming call To:", to);

  const business = await db.business
    .findFirst({ where: { phoneNumber: to, isActive: true } })
    .catch((err) => { console.error("[Voice] DB error:", err); return null; });

  const businessName = business?.name ?? "this business";
  const voiceId = business?.voiceId ?? DEFAULT_VOICE_ID;

  // Business hours check
  if (business && !isBusinessOpen(business.businessHours)) {
    const hoursText = getBusinessHoursText(business.businessHours);
    const closedUrl = buildTtsUrl(
      baseUrl,
      `Thank you for calling ${businessName}. We are currently closed. Our hours are ${hoursText}. Please call back during business hours. Goodbye!`,
      voiceId
    );
    return twiml(`  <Play>${closedUrl}</Play>\n  <Hangup/>`);
  }

  // Plan enforcement
  if (business) {
    const status = getPlanStatus(business);
    if (!status.allowed) {
      const msg = status.isTrialExpired
        ? `Thank you for calling ${businessName}. Our AI service is currently unavailable. Please contact the business directly.`
        : `Thank you for calling ${businessName}. We are unable to take calls at this time. Please try again later.`;
      return twiml(`  <Say>${msg}</Say>\n  <Hangup/>`);
    }
  }

  const greetingText = `Hello! Thank you for calling ${businessName}. How can I help you today?`;
  const greetingUrl = buildTtsUrl(baseUrl, greetingText, voiceId);

  return twiml(
    `  <Play>${greetingUrl}</Play>\n` +
    `  <Gather input="speech" action="${baseUrl}/api/webhooks/voice/gather" method="POST" ` +
    `timeout="5" speechTimeout="auto" language="en-NG">\n  </Gather>\n` +
    `  <Redirect>${baseUrl}/api/webhooks/voice</Redirect>`
  );
}
