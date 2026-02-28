import { NextRequest, NextResponse } from "next/server";
import { getVoiceResult } from "@han/ai";

// Called by AT after playing "Please hold" + recording silence.
// By this time (~20-25s), background processing should be done.
export async function POST(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  const isActive = params.get("isActive") ?? "1";

  console.log("[AT Respond] sid:", sid, "isActive:", isActive);

  if (!sid) {
    return atXml(`<Say>Sorry, something went wrong. Please call again.</Say>`);
  }

  const result = await getVoiceResult(sid);

  if (!result) {
    // Still processing — give it a few more seconds
    console.log("[AT Respond] Result not ready yet for sid:", sid);
    return atXml(
      `<Say voice="woman">Just one more moment please.</Say>` +
      `<Record maxLength="10" timeout="10" trimSilence="true" callbackUrl="${baseUrl}/api/webhooks/voice/at/respond?sid=${sid}"/>`
    );
  }

  console.log("[AT Respond] Delivering result for sid:", sid, "→", result.text);

  // Deliver the AI response, then start a fresh recording for the next question
  return atXml(
    `<Say voice="woman">${escapeXml(result.text)}</Say>` +
    `<Say voice="woman">Is there anything else I can help you with?</Say>` +
    `<Record maxLength="8" timeout="3" trimSilence="true" callbackUrl="${baseUrl}/api/webhooks/voice/at"/>`
  );
}

function atXml(content: string): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
