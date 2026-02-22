import { NextRequest, NextResponse } from "next/server";
import { db } from "@han/database";

// Called by Twilio when a customer calls the business phone number.
// Looks up the business, greets the caller, and starts listening.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  const to = params.get("To") ?? "";           // the Twilio number that was called
  const calledNumber = to.replace(/^\+/, "+"); // normalize

  // Look up business by voice phone number
  const business = await db.business.findFirst({
    where: { phoneNumber: calledNumber, isActive: true },
  }).catch((err) => { console.error("[Voice] DB lookup error:", err); return null; });

  const businessName = business?.name ?? "this business";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-NG">
    Hello! Thank you for calling ${escapeXml(businessName)}.
    How can I help you today?
  </Say>
  <Gather input="speech" action="${baseUrl}/api/webhooks/voice/gather" method="POST"
    speechTimeout="auto" language="en-NG" timeout="5">
  </Gather>
  <Say voice="Polly.Joanna">
    I didn't catch that. Please call back and try again. Goodbye!
  </Say>
</Response>`;

  return new NextResponse(twiml, {
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
