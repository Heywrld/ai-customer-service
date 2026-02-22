import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@han/database";

// ─── Twilio REST client for async replies ─────────────────────────────────────
function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

async function sendWhatsAppReply(to: string, from: string, body: string) {
  try {
    await getTwilioClient().messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      body,
    });
  } catch (err) {
    console.error("[WhatsApp] Failed to send reply:", err);
  }
}
import {
  createAIClient,
  routeModel,
  getCached,
  setCached,
  matchFAQ,
  compressPrompt,
  optimizeConversation,
  logUsage,
} from "@han/ai";
import type { FAQTemplate } from "@han/ai";
import { getPlanStatus } from "@/lib/plan";

// ─── Twilio signature validation ─────────────────────────────────────────────
function validateTwilioSignature(req: NextRequest, body: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = req.url;

  // Parse form body into key-value pairs for Twilio validation
  const params: Record<string, string> = {};
  new URLSearchParams(body).forEach((v, k) => { params[k] = v; });

  return twilio.validateRequest(authToken, signature, url, params);
}

// ─── Pidgin detection ─────────────────────────────────────────────────────────
const PIDGIN_MARKERS = [
  "wetin", "dey", "abeg", "oya", "wahala", "shey", "don", "na", "dem",
  "una", "e go", "e be", "no be", "fit", "sabi", "chop", "palava",
];

function detectsPidgin(text: string): boolean {
  const lower = text.toLowerCase();
  return PIDGIN_MARKERS.some((m) => lower.includes(m));
}

// ─── Main webhook handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Validate it's genuinely from Twilio (skip in dev)
  if (process.env.NODE_ENV === "production") {
    if (!validateTwilioSignature(req, rawBody)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const params = new URLSearchParams(rawBody);
  const from = params.get("From") ?? "";       // e.g. whatsapp:+2348012345678
  const to = params.get("To") ?? "";           // e.g. whatsapp:+14155238886
  const incomingMessage = (params.get("Body") ?? "").trim();

  if (!incomingMessage || !from) {
    return emptyTwiml(); // empty body = media-only message, ignore
  }

  const fromNumber = from.replace("whatsapp:", "");
  const toNumber = to.replace("whatsapp:", "");

  // ── Respond to Twilio immediately (avoids 15s timeout) ──────────────────────
  // All AI processing happens async — reply sent via REST API below
  processAndReply(fromNumber, toNumber, incomingMessage).catch(console.error);
  return emptyTwiml();
}

// ─── Async pipeline ───────────────────────────────────────────────────────────
async function processAndReply(fromNumber: string, toNumber: string, incomingMessage: string) {
  try {
    // 1. Look up the business by their WhatsApp number
    const business = await db.business.findFirst({
      where: { whatsappNumber: toNumber, isActive: true },
      include: { faqTemplates: { where: { isActive: true } } },
    });

    if (!business) {
      await sendWhatsAppReply(fromNumber, toNumber,
        "Sorry, this number isn't set up yet. Please contact the business directly."
      );
      return;
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

    // 3. Enforce plan limits
    const planStatus = getPlanStatus({ ...business, monthlyCallCount: callsUsed });
    if (!planStatus.allowed) {
      const msg = planStatus.isTrialExpired
        ? `Your 14-day free trial has ended. Visit ${process.env.NEXT_PUBLIC_APP_URL ?? "your dashboard"} to upgrade and keep Han answering your customers. 🙏`
        : `You've used all ${planStatus.callsLimit} messages on your plan this month. Upgrade at ${process.env.NEXT_PUBLIC_APP_URL ?? "your dashboard"} to continue. 🚀`;
      await sendWhatsAppReply(fromNumber, toNumber, msg);
      return;
    }

    // 4. Find or create the customer
    const phoneNumber = fromNumber;
    const usesPidgin = detectsPidgin(incomingMessage);

    const customer = await db.customer.upsert({
      where: { businessId_phoneNumber: { businessId: business.id, phoneNumber } },
      create: {
        businessId: business.id,
        phoneNumber,
        usesPidgin,
        languagePreference: usesPidgin ? "pidgin" : "en",
      },
      update: {
        lastSeenAt: new Date(),
        ...(usesPidgin ? { usesPidgin: true } : {}),
      },
    });

    // 3. Find or create active conversation
    let conversation = await db.conversation.findFirst({
      where: {
        businessId: business.id,
        customerId: customer.id,
        channel: "whatsapp",
        status: "active",
      },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          channel: "whatsapp",
          status: "active",
        },
        include: { messages: true },
      });
    }

    // 4. Save the incoming message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: incomingMessage,
      },
    });

    // 5. FAQ matcher — zero AI cost
    const faqTemplates: FAQTemplate[] = business.faqTemplates.map((t) => ({
      id: t.id,
      triggerPhrases: t.triggerPhrases,
      response: t.response,
      language: t.language ?? "en",
    }));
    const faqResult = matchFAQ(incomingMessage, faqTemplates);
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
      await sendWhatsAppReply(fromNumber, toNumber, faqResult.response);
      return;
    }

    // 6. Build message history for the AI
    const history = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 7. Summarize long conversations (>6 messages) to save tokens
    const { messages: optimizedHistory } = history.length > 6
      ? await optimizeConversation(history, conversation.summary)
      : { messages: history };

    // 8. Redis cache check
    const cached = await getCached(business.id, incomingMessage);
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
      await sendWhatsAppReply(fromNumber, toNumber, cached);
      return;
    }

    // 9. Route to the right model
    const model = routeModel(incomingMessage);

    // 10. Build compressed system prompt
    const systemPrompt = compressPrompt(
      { id: business.id, name: business.name, systemPrompt: business.systemPrompt, industry: business.industry, city: business.city },
      customer.usesPidgin
    );

    // 11. Call Claude
    const ai = createAIClient();
    const aiResponse = await ai.messages.create({
      model,
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        ...optimizedHistory,
        { role: "user", content: incomingMessage },
      ],
    });

    const replyText =
      aiResponse.content[0].type === "text"
        ? aiResponse.content[0].text
        : "Sorry, I had trouble processing that. Please try again.";

    const inputTokens = aiResponse.usage.input_tokens;
    const outputTokens = aiResponse.usage.output_tokens;

    // 12. Cache the response for future identical questions
    await setCached(business.id, incomingMessage, replyText);

    // 13. Save assistant reply + update conversation + increment call count
    await db.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: replyText },
    });
    await db.conversation.update({
      where: { id: conversation.id },
      data: { messageCount: { increment: 2 }, updatedAt: new Date() },
    });
    await db.business.update({
      where: { id: business.id },
      data: { monthlyCallCount: { increment: 1 } },
    }).catch(() => null);

    // 14. Log usage (non-blocking)
    logUsage({
      businessId: business.id,
      conversationId: conversation.id,
      model,
      inputTokens,
      outputTokens,
      cacheHit: false,
      faqMatched: false,
      queryType: model === "claude-haiku-4-5-20251001" ? "simple" : "complex",
    }).catch(console.error);

    await sendWhatsAppReply(fromNumber, toNumber, replyText);

  } catch (err) {
    console.error("[WhatsApp webhook] Error:", err);
    await sendWhatsAppReply(fromNumber, toNumber,
      "Sorry, something went wrong. Please try again in a moment."
    );
  }
}

// ─── Empty TwiML — acknowledge Twilio instantly ───────────────────────────────
function emptyTwiml(): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

// ─── TwiML helper (kept for reference) ───────────────────────────────────────
function twimlResponse(message: string): NextResponse {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

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
