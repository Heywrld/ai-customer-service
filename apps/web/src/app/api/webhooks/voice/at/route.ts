import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@han/database";
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

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const isActive = params.get("isActive") ?? "1";
  const callerNumber = params.get("callerNumber") ?? "";
  const destinationNumber = params.get("destinationNumber") ?? "";
  const sessionId = params.get("sessionId") ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  console.log("[AT Voice] POST:", { isActive, callerNumber, destinationNumber, sessionId });

  // Call ended — no action needed
  if (isActive === "0") {
    return new NextResponse("", { status: 200 });
  }

  // New incoming call → look up business and serve greeting + Record
  const business = await db.business
    .findFirst({ where: { phoneNumber: destinationNumber, isActive: true } })
    .catch((err) => {
      console.error("[AT Voice] DB error:", err);
      return null;
    });

  const businessName = business?.name ?? "this business";
  const voiceId = business?.voiceId ?? DEFAULT_VOICE_ID;

  // Business hours check — play a closed message and hang up if outside hours
  if (business && !isBusinessOpen(business.businessHours)) {
    const hoursText = getBusinessHoursText(business.businessHours);
    const closedText = `Thank you for calling ${businessName}. We are currently closed. Our business hours are ${hoursText}. Please call back during our business hours. Thank you.`;
    const closedUrl = buildTtsUrl(baseUrl, closedText, voiceId);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Play url="${closedUrl}"/>\n</Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  const greetingText = `Hello! Thank you for calling ${businessName}. How can I help you today?`;
  const greetingUrl = buildTtsUrl(baseUrl, greetingText, voiceId);

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play url="${greetingUrl}"/>
  <Record maxLength="30" timeout="3" trimSilence="true" playBeep="false"
    callbackUrl="${baseUrl}/api/webhooks/voice/at/recording"/>
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
