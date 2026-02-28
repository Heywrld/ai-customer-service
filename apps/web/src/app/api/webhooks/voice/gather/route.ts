import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@han/database";
import {
  createAIClient,
  routeModel,
  getCached,
  setCached,
  compressPrompt,
  logUsage,
} from "@han/ai";
import { getPlanStatus } from "@/lib/plan";

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

function escapeXml(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const transcript = (params.get("SpeechResult") ?? "").trim();
  const calledNumber = params.get("To") ?? "";
  const callerNumber = params.get("From") ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  console.log("[Voice Gather] Transcript:", transcript, "| To:", calledNumber);

  // Business lookup first — so every response uses the business's voice
  const business = await db.business.findFirst({
    where: { phoneNumber: calledNumber, isActive: true },
  }).catch((err) => { console.error("[Voice Gather] DB error:", err); return null; });

  console.log("[Voice Gather] Business:", business?.name ?? "NONE");

  const voiceId = business?.voiceId ?? DEFAULT_VOICE_ID;

  if (!transcript) {
    const fallback = "Sorry, I didn't catch that. Could you please repeat?";
    return twimlResponse(`<Play>${buildTtsUrl(baseUrl, fallback, voiceId)}</Play>`, baseUrl);
  }

  if (!business) {
    return twimlResponse(`<Say>${escapeXml("Sorry, this number is not configured.")}</Say>`, baseUrl, true);
  }

  // Reset monthly call count if billing period rolled over
  let callsUsed = business.monthlyCallCount;
  if (business.callCountResetAt < new Date()) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);
    await db.business.update({
      where: { id: business.id },
      data: { monthlyCallCount: 0, callCountResetAt: nextReset },
    }).catch(() => null);
    callsUsed = 0;
  }

  const planStatus = getPlanStatus({ ...business, monthlyCallCount: callsUsed });
  if (!planStatus.allowed) {
    const msg = planStatus.reason ?? "Your account limit has been reached. Please upgrade.";
    return twimlResponse(`<Play>${buildTtsUrl(baseUrl, msg, business.voiceId ?? DEFAULT_VOICE_ID)}</Play>`, baseUrl, true);
  }

  // ── Opt 1: Parallelize customer upsert + cache check ──────────────────────
  const [customer, cached] = await Promise.all([
    db.customer.upsert({
      where: { businessId_phoneNumber: { businessId: business.id, phoneNumber: callerNumber } },
      create: { businessId: business.id, phoneNumber: callerNumber },
      update: { lastSeenAt: new Date() },
    }).catch(() => null),
    getCached(business.id, transcript),
  ]);

  // ── Cache hit: skip Claude entirely ───────────────────────────────────────
  if (cached) {
    console.log("[Voice Gather] Cache hit");
    return twimlResponse(`<Play>${buildTtsUrl(baseUrl, cached, voiceId)}</Play>`, baseUrl);
  }

  // ── Cache miss: conversation + Claude ─────────────────────────────────────
  let conversation = await db.conversation.findFirst({
    where: { businessId: business.id, customerId: customer?.id, channel: "voice", status: "active" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } },
  }).catch(() => null);

  if (!conversation && customer) {
    conversation = await db.conversation.create({
      data: { businessId: business.id, customerId: customer.id, channel: "voice", status: "active" },
      include: { messages: true },
    }).catch(() => null);
  }

  // Fire-and-forget user message save — don't block Claude
  if (conversation) {
    db.message.create({ data: { conversationId: conversation.id, role: "user", content: transcript } }).catch(() => null);
  }

  const model = routeModel(transcript);
  const systemPrompt = compressPrompt(
    { id: business.id, name: business.name, systemPrompt: business.systemPrompt, industry: business.industry, city: business.city },
    false
  );
  const history = (conversation?.messages ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const ai = createAIClient();
  const aiResponse = await ai.messages.create({
    model,
    max_tokens: 200,
    system: systemPrompt + "\n\nIMPORTANT: This is a voice call. Keep your response to 1-2 sentences maximum. No markdown, no bullet points.",
    messages: [...history, { role: "user", content: transcript }],
  });

  const replyText = aiResponse.content[0].type === "text"
    ? aiResponse.content[0].text
    : "I'm sorry, I had trouble with that. Could you please repeat?";

  console.log("[Voice Gather] Reply:", replyText);

  // Fire-and-forget all DB writes + cache
  Promise.all([
    conversation
      ? db.message.create({ data: { conversationId: conversation.id, role: "assistant", content: replyText } }).catch(() => null)
      : null,
    conversation
      ? db.conversation.update({ where: { id: conversation.id }, data: { messageCount: { increment: 2 } } }).catch(() => null)
      : null,
    db.business.update({ where: { id: business.id }, data: { monthlyCallCount: { increment: 1 } } }).catch(() => null),
    setCached(business.id, transcript, replyText).catch(() => null),
    logUsage({
      businessId: business.id,
      conversationId: conversation?.id,
      model,
      inputTokens: aiResponse.usage.input_tokens,
      outputTokens: aiResponse.usage.output_tokens,
      cacheHit: false,
      faqMatched: false,
      queryType: "voice",
    }).catch(() => null),
  ]);

  return twimlResponse(`<Play>${buildTtsUrl(baseUrl, replyText, voiceId)}</Play>`, baseUrl);
}

function twimlResponse(speakTag: string, baseUrl: string, hangup = false): NextResponse {
  const xml = hangup
    ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${speakTag}
  <Hangup/>
</Response>`
    : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${speakTag}
  <Gather input="speech" action="${baseUrl}/api/webhooks/voice/gather" method="POST"
    speechTimeout="auto" language="en-US" timeout="5">
  </Gather>
</Response>`;

  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}
