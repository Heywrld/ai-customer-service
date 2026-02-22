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
import { storeAudio } from "@/lib/audioCache";
import { getPlanStatus } from "@/lib/plan";

// AT sends recording URL here after caller speaks
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  const recordingUrl = params.get("recordingUrl") ?? "";
  const durationInSeconds = params.get("durationInSeconds") ?? "0";

  // Query params passed from the initial webhook
  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId") ?? "";
  const callerNumber = url.searchParams.get("callerNumber") ?? "";
  const destinationNumber = url.searchParams.get("destinationNumber") ?? "";
  const sessionId = url.searchParams.get("sessionId") ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  console.log("[AT Recording] recordingUrl:", recordingUrl, "duration:", durationInSeconds);

  // Nothing recorded or too short
  if (!recordingUrl || parseFloat(durationInSeconds) < 0.5) {
    return atXml(`<Say>Sorry, I didn't catch that. Please speak after calling back. Goodbye!</Say>`);
  }

  // Look up business
  const business = await db.business.findFirst({
    where: { id: businessId, isActive: true },
  }).catch(() => null);

  if (!business) {
    return atXml(`<Say>Sorry, this service is not configured. Goodbye!</Say>`);
  }

  // Reset monthly call count if billing period has rolled over
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

  // Enforce plan limits
  const planStatus = getPlanStatus({ ...business, monthlyCallCount: callsUsed });
  if (!planStatus.allowed) {
    const msg = planStatus.reason ?? "Your account limit has been reached. Please visit your dashboard to upgrade.";
    return atXml(`<Say>${escapeXml(msg)}</Say>`);
  }

  // Find or create customer
  const customer = await db.customer.upsert({
    where: { businessId_phoneNumber: { businessId: business.id, phoneNumber: callerNumber } },
    create: { businessId: business.id, phoneNumber: callerNumber },
    update: { lastSeenAt: new Date() },
  }).catch(() => null);

  // Find or create voice conversation
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

  // Download the recording from AT and transcribe
  let transcript = "";
  try {
    const atApiKey = process.env.AFRICASTALKING_API_KEY!;
    const audioRes = await fetch(recordingUrl, {
      headers: { "apiKey": atApiKey },
    });
    if (!audioRes.ok) throw new Error(`Failed to fetch recording: ${audioRes.status}`);

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    const { speechToText } = await import("@han/voice");
    transcript = await speechToText(audioBuffer);
    console.log("[AT Recording] Transcript:", transcript);
  } catch (err) {
    console.error("[AT Recording] STT error:", err);
    return atXml(
      `<Say>Sorry, I had trouble hearing you. Please try again.</Say>` +
      retryRecord(baseUrl, businessId, callerNumber, destinationNumber, sessionId)
    );
  }

  if (!transcript) {
    return atXml(
      `<Say>Sorry, I didn't catch that. Please try again.</Say>` +
      retryRecord(baseUrl, businessId, callerNumber, destinationNumber, sessionId)
    );
  }

  // Save user message
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
    return await buildVoiceResponse(cached, business, baseUrl, businessId, callerNumber, destinationNumber, sessionId);
  }

  // Call Claude
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
    max_tokens: 150,
    system: systemPrompt + "\n\nIMPORTANT: This is a voice call. Keep your response to 1-2 sentences. No markdown, no bullet points.",
    messages: [...history, { role: "user", content: transcript }],
  });

  const replyText = aiResponse.content[0].type === "text"
    ? aiResponse.content[0].text
    : "I'm sorry, I had trouble with that. Could you please repeat?";

  // Save + cache + increment call count
  if (conversation) {
    await db.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: replyText },
    }).catch(() => null);
    await db.conversation.update({
      where: { id: conversation.id },
      data: { messageCount: { increment: 2 } },
    }).catch(() => null);
  }
  await db.business.update({
    where: { id: business.id },
    data: { monthlyCallCount: { increment: 1 } },
  }).catch(() => null);
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

  return await buildVoiceResponse(replyText, business, baseUrl, businessId, callerNumber, destinationNumber, sessionId);
}

// Build AT XML response: ElevenLabs TTS audio + prompt for next recording
async function buildVoiceResponse(
  replyText: string,
  business: { voiceId: string | null },
  baseUrl: string,
  businessId: string,
  callerNumber: string,
  destinationNumber: string,
  sessionId: string
): Promise<NextResponse> {
  const recordAction = retryRecord(baseUrl, businessId, callerNumber, destinationNumber, sessionId);

  try {
    const { textToSpeech } = await import("@han/voice");
    const buf = await textToSpeech(replyText, business.voiceId ?? undefined);
    const audioUrl = `${baseUrl}/api/voice/audio/${storeAudio(buf)}`;
    return atXml(`<Play url="${audioUrl}"/>${recordAction}`);
  } catch {
    // Fallback to AT's built-in TTS
    return atXml(`<Say>${escapeXml(replyText)}</Say>${recordAction}`);
  }
}

function retryRecord(
  baseUrl: string,
  businessId: string,
  callerNumber: string,
  destinationNumber: string,
  sessionId: string
): string {
  const cb = `${baseUrl}/api/webhooks/voice/at/recording?businessId=${businessId}&amp;callerNumber=${encodeURIComponent(callerNumber)}&amp;destinationNumber=${encodeURIComponent(destinationNumber)}&amp;sessionId=${encodeURIComponent(sessionId)}`;
  return `<Record finishOnKey="#" maxLength="30" trimSilence="true" playBeep="false" callbackUrl="${cb}"/>`;
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
