import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@han/database";
import {
  createAIClient,
  getCached,
  setCached,
  matchFAQ,
  compressPrompt,
  optimizeConversation,
  logUsage,
} from "@han/ai";
import type { FAQTemplate } from "@han/ai";
import { getPlanStatus } from "@/lib/plan";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const PIDGIN_MARKERS = [
  "wetin", "dey", "abeg", "oya", "wahala", "shey", "don", "na", "dem",
  "una", "e go", "e be", "no be", "fit", "sabi", "chop", "palava",
];
function detectsPidgin(text: string): boolean {
  const lower = text.toLowerCase();
  return PIDGIN_MARKERS.some((m) => lower.includes(m));
}

function buildTtsUrl(baseUrl: string, text: string, voiceId: string): string {
  const ts = Date.now().toString();
  const t = Buffer.from(text).toString("base64url");
  const sig = createHmac("sha256", process.env.CLERK_SECRET_KEY ?? "han-tts-secret")
    .update(`${t}:${voiceId}:${ts}`)
    .digest("hex");
  const p = Buffer.from(JSON.stringify({ t, v: voiceId, ts, sig })).toString("base64url");
  return `${baseUrl}/api/tts?p=${p}`;
}

function voiceReply(ttsUrl: string, gatherUrl: string): NextResponse {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n` +
    `  <Play>${ttsUrl}</Play>\n` +
    `  <Gather input="speech" action="${gatherUrl}" method="POST" ` +
    `timeout="5" speechTimeout="auto" language="en-NG">\n  </Gather>\n` +
    `</Response>`;
  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}

function sayAndHangup(message: string): NextResponse {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n` +
    `  <Say>${message}</Say>\n  <Hangup/>\n</Response>`;
  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}

// Handles what the customer said — full AI pipeline, conversational loop.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const speechResult = (params.get("SpeechResult") ?? "").trim();
  const rawTo = params.get("To") ?? "";
  const rawFrom = params.get("From") ?? "";

  // For outbound calls, To/From are reversed — businessPhone query param tells us the Han number
  const businessPhone = req.nextUrl.searchParams.get("businessPhone");
  const to = businessPhone ?? rawTo;       // Han pool number (for business lookup)
  const from = businessPhone ? rawTo : rawFrom; // Customer number

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const gatherUrl = businessPhone
    ? `${baseUrl}/api/webhooks/voice/gather?businessPhone=${encodeURIComponent(businessPhone)}`
    : `${baseUrl}/api/webhooks/voice/gather`;

  // Empty speech — ask the caller to try again
  if (!speechResult) {
    const retryUrl = buildTtsUrl(baseUrl, "I didn't catch that. Please go ahead and speak.", DEFAULT_VOICE_ID);
    return voiceReply(retryUrl, gatherUrl);
  }

  console.log(`[Voice/Gather] From=${from} To=${to} Speech="${speechResult.slice(0, 80)}"`);

  try {
    // 1. Business lookup
    const business = await db.business.findFirst({
      where: { phoneNumber: to, isActive: true },
      include: { faqTemplates: { where: { isActive: true } } },
    });

    if (!business) {
      return sayAndHangup("Sorry, this number is not set up. Please contact the business directly. Goodbye.");
    }

    // 2. Reset monthly count if billing period rolled over
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

    // 3. Plan enforcement
    const planStatus = getPlanStatus({ ...business, monthlyCallCount: callsUsed });
    if (!planStatus.allowed) {
      return sayAndHangup("Sorry, this service is currently unavailable. Please contact the business directly. Goodbye.");
    }

    const voiceId = business.voiceId ?? DEFAULT_VOICE_ID;

    // 4. Customer upsert with Pidgin detection
    const usesPidgin = detectsPidgin(speechResult);
    const customer = await db.customer.upsert({
      where: { businessId_phoneNumber: { businessId: business.id, phoneNumber: from } },
      create: {
        businessId: business.id,
        phoneNumber: from,
        usesPidgin,
        languagePreference: usesPidgin ? "pidgin" : "en",
      },
      update: {
        lastSeenAt: new Date(),
        ...(usesPidgin ? { usesPidgin: true } : {}),
      },
    });

    // 5. Find or create voice conversation
    let conversation = await db.conversation.findFirst({
      where: { businessId: business.id, customerId: customer.id, channel: "voice", status: "active" },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: { businessId: business.id, customerId: customer.id, channel: "voice", status: "active" },
        include: { messages: true },
      });
    }

    // 6. Save the incoming speech
    await db.message.create({
      data: { conversationId: conversation.id, role: "user", content: speechResult },
    });

    // 7. FAQ matcher — zero AI cost
    const faqTemplates: FAQTemplate[] = business.faqTemplates.map((t) => ({
      id: t.id,
      triggerPhrases: t.triggerPhrases,
      response: t.response,
      language: t.language ?? "en",
    }));
    const faqResult = matchFAQ(speechResult, faqTemplates);
    if (faqResult.matched) {
      await db.message.create({
        data: { conversationId: conversation.id, role: "assistant", content: faqResult.response },
      });
      await db.conversation.update({
        where: { id: conversation.id },
        data: { messageCount: { increment: 2 } },
      });
      await logUsage({
        businessId: business.id,
        conversationId: conversation.id,
        model: "claude-haiku-4-5-20251001",
        inputTokens: 0,
        outputTokens: 0,
        cacheHit: false,
        faqMatched: true,
        queryType: "faq",
      });
      return voiceReply(buildTtsUrl(baseUrl, faqResult.response, voiceId), gatherUrl);
    }

    // 8. Build + optimize message history
    const history = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    const { messages: optimizedHistory } = history.length > 6
      ? await optimizeConversation(history, conversation.summary)
      : { messages: history };

    // 9. Redis cache check
    const cached = await getCached(business.id, speechResult);
    if (cached) {
      await db.message.create({
        data: { conversationId: conversation.id, role: "assistant", content: cached, isCached: true },
      });
      await db.conversation.update({
        where: { id: conversation.id },
        data: { messageCount: { increment: 2 } },
      });
      await logUsage({
        businessId: business.id,
        conversationId: conversation.id,
        model: "claude-haiku-4-5-20251001",
        inputTokens: 0,
        outputTokens: 0,
        cacheHit: true,
        faqMatched: false,
        queryType: "cached",
      });
      return voiceReply(buildTtsUrl(baseUrl, cached, voiceId), gatherUrl);
    }

    // 10. Always use Haiku for voice — fastest model, beats Twilio's 15s webhook timeout
    const model = "claude-haiku-4-5-20251001" as const;
    const systemPrompt =
      compressPrompt(
        { id: business.id, name: business.name, systemPrompt: business.systemPrompt, industry: business.industry, city: business.city },
        customer.usesPidgin
      ) + "\n\nThis is a voice call. Keep responses to 1–2 sentences. No markdown, no bullet points.";

    // 11. Claude
    const ai = createAIClient();
    const aiResponse = await ai.messages.create({
      model,
      max_tokens: 150,
      system: systemPrompt,
      messages: [...optimizedHistory, { role: "user", content: speechResult }],
    });

    const replyText =
      aiResponse.content[0].type === "text"
        ? aiResponse.content[0].text
        : "Sorry, I had trouble with that. Could you repeat your question?";

    const inputTokens = aiResponse.usage.input_tokens;
    const outputTokens = aiResponse.usage.output_tokens;

    // 12. Cache + save + count (non-blocking where safe)
    await Promise.all([
      setCached(business.id, speechResult, replyText).catch(() => null),
      db.message.create({
        data: { conversationId: conversation.id, role: "assistant", content: replyText },
      }),
      db.conversation.update({
        where: { id: conversation.id },
        data: { messageCount: { increment: 2 }, updatedAt: new Date() },
      }),
      db.business.update({
        where: { id: business.id },
        data: { monthlyCallCount: { increment: 1 } },
      }).catch(() => null),
      logUsage({
        businessId: business.id,
        conversationId: conversation.id,
        model,
        inputTokens,
        outputTokens,
        cacheHit: false,
        faqMatched: false,
        queryType: "voice",
      }).catch(() => null),
    ]);

    return voiceReply(buildTtsUrl(baseUrl, replyText, voiceId), gatherUrl);

  } catch (err) {
    console.error("[Voice/Gather] Error:", err);
    const errUrl = buildTtsUrl(baseUrl, "Sorry, something went wrong. Please try again in a moment.", DEFAULT_VOICE_ID);
    return voiceReply(errUrl, gatherUrl);
  }
}
