import { NextRequest, NextResponse } from "next/server";
import { db } from "@han/database";
import {
  createAIClient,
  routeModel,
  getCached,
  setCached,
  compressPrompt,
  logUsage,
} from "@han/ai";
import { randomUUID } from "crypto";

// In-memory audio cache: id → MP3 buffer (TTL 5 min)
const audioCache = new Map<string, { buffer: Buffer; expiresAt: number }>();

// Prune expired audio every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of audioCache) {
    if (entry.expiresAt < now) audioCache.delete(id);
  }
}, 5 * 60 * 1000);

export async function storeAudio(buffer: Buffer): Promise<string> {
  const id = randomUUID();
  audioCache.set(id, { buffer, expiresAt: Date.now() + 5 * 60 * 1000 });
  return id;
}

export function getAudio(id: string): Buffer | null {
  const entry = audioCache.get(id);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.buffer;
}

function escapeXml(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function twimlSay(text: string, useElevenLabs: boolean, audioUrl?: string): string {
  if (useElevenLabs && audioUrl) {
    return `<Play>${escapeXml(audioUrl)}</Play>`;
  }
  return `<Say voice="Polly.Joanna" language="en-NG">${escapeXml(text)}</Say>`;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const transcript = (params.get("SpeechResult") ?? "").trim();
  const calledNumber = params.get("To") ?? "";
  const callerNumber = params.get("From") ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;

  // Nothing heard
  if (!transcript) {
    const fallback = "Sorry, I didn't catch that. Could you please repeat?";
    let audioUrl: string | undefined;
    if (hasElevenLabs) {
      const { textToSpeech } = await import("@han/voice");
      const buf = await textToSpeech(fallback).catch(() => null);
      if (buf) audioUrl = `${baseUrl}/api/voice/audio/${await storeAudio(buf)}`;
    }
    return twimlResponse(twimlSay(fallback, hasElevenLabs, audioUrl), baseUrl);
  }

  // Look up business by voice phone number
  const business = await db.business.findFirst({
    where: { phoneNumber: calledNumber, isActive: true },
  }).catch(() => null);

  if (!business) {
    const msg = "Sorry, this number is not configured. Please try again later.";
    return twimlResponse(twimlSay(msg, false), baseUrl);
  }

  // Find or create caller as customer
  const customer = await db.customer.upsert({
    where: { businessId_phoneNumber: { businessId: business.id, phoneNumber: callerNumber } },
    create: { businessId: business.id, phoneNumber: callerNumber },
    update: { lastSeenAt: new Date() },
  }).catch(() => null);

  // Find or create active voice conversation
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

  // Save user turn
  if (conversation) {
    await db.message.create({
      data: { conversationId: conversation.id, role: "user", content: transcript },
    }).catch(() => null);
  }

  // Cache check
  const cached = await getCached(business.id, transcript);
  if (cached) {
    if (conversation) {
      await db.message.create({
        data: { conversationId: conversation.id, role: "assistant", content: cached, isCached: true },
      }).catch(() => null);
    }
    let audioUrl: string | undefined;
    if (hasElevenLabs) {
      const { textToSpeech } = await import("@han/voice");
      const buf = await textToSpeech(cached, business.voiceId ?? undefined).catch(() => null);
      if (buf) audioUrl = `${baseUrl}/api/voice/audio/${await storeAudio(buf)}`;
    }
    return twimlResponse(twimlSay(cached, hasElevenLabs, audioUrl), baseUrl);
  }

  // Call Claude
  const model = routeModel(transcript);
  const systemPrompt = compressPrompt(
    { id: business.id, name: business.name, systemPrompt: business.systemPrompt, industry: business.industry, city: business.city },
    false // voice calls default to English
  );

  const history = (conversation?.messages ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const ai = createAIClient();
  const aiResponse = await ai.messages.create({
    model,
    max_tokens: 200, // keep voice responses short
    system: systemPrompt + "\n\nIMPORTANT: This is a voice call. Keep your response to 1-2 sentences maximum. No markdown, no bullet points.",
    messages: [...history, { role: "user", content: transcript }],
  });

  const replyText = aiResponse.content[0].type === "text"
    ? aiResponse.content[0].text
    : "I'm sorry, I had trouble with that. Could you please repeat your question?";

  // Save + cache
  if (conversation) {
    await db.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: replyText },
    }).catch(() => null);
    await db.conversation.update({
      where: { id: conversation.id },
      data: { messageCount: { increment: 2 } },
    }).catch(() => null);
  }
  await setCached(business.id, transcript, replyText);
  await logUsage({
    businessId: business.id,
    conversationId: conversation?.id,
    model,
    inputTokens: aiResponse.usage.input_tokens,
    outputTokens: aiResponse.usage.output_tokens,
    cacheHit: false,
    faqMatched: false,
    queryType: "voice",
  }).catch(() => null);

  // TTS via ElevenLabs
  let audioUrl: string | undefined;
  if (hasElevenLabs) {
    try {
      const { textToSpeech } = await import("@han/voice");
      const buf = await textToSpeech(replyText, business.voiceId ?? undefined);
      audioUrl = `${baseUrl}/api/voice/audio/${await storeAudio(buf)}`;
    } catch (err) {
      console.error("[Voice] ElevenLabs TTS failed:", err);
    }
  }

  return twimlResponse(twimlSay(replyText, hasElevenLabs, audioUrl), baseUrl);
}

function twimlResponse(speakTag: string, baseUrl: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${speakTag}
  <Gather input="speech" action="${baseUrl}/api/webhooks/voice/gather" method="POST"
    speechTimeout="auto" language="en-NG" timeout="5">
  </Gather>
  <Say voice="Polly.Joanna">Is there anything else I can help you with?</Say>
</Response>`;

  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}
