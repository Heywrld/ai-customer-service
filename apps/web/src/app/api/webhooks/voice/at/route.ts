import { NextRequest, NextResponse } from "next/server";
import { db } from "@han/database";

// Africa's Talking inbound call webhook
// Called when a customer calls the business's AT phone number
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const callerNumber = params.get("callerNumber") ?? "";
  const destinationNumber = params.get("destinationNumber") ?? "";
  const sessionId = params.get("sessionId") ?? "";

  console.log("[AT Voice] Inbound call:", { callerNumber, destinationNumber, sessionId });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  // Look up business by their AT phone number
  const business = await db.business.findFirst({
    where: { phoneNumber: destinationNumber, isActive: true },
  }).catch((err) => { console.error("[AT Voice] DB error:", err); return null; });

  const businessName = business?.name ?? "this business";

  console.log("[AT Voice] Business:", businessName);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="en-NG-EzechinaomObi-Standard" playBeep="false">${escapeXml(`Hello! Thank you for calling ${businessName}. How can I help you today?`)}</Say>
  <Record finishOnKey="#" maxLength="30" trimSilence="true" playBeep="false"
    callbackUrl="${baseUrl}/api/webhooks/voice/at/recording?businessId=${business?.id ?? ""}&amp;callerNumber=${encodeURIComponent(callerNumber)}&amp;destinationNumber=${encodeURIComponent(destinationNumber)}&amp;sessionId=${encodeURIComponent(sessionId)}"/>
</Response>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
