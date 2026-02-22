import { NextRequest, NextResponse } from "next/server";
import { createAIClient } from "@han/ai";

// Rate limit: 20 demo messages per IP per hour (in-memory, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }

  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { response: "You've tried Han a lot! Sign up to keep chatting 😊" },
      { status: 200 }
    );
  }

  const { message, history, business } = await req.json();

  if (!message || typeof message !== "string" || message.length > 500) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const systemPrompt = `You are a customer service AI for ${business.name}.
${business.description}
Respond naturally in the same language/dialect the customer uses.
If they use Nigerian Pidgin, respond in Pidgin. If English, use English.
Be warm, brief (2-3 sentences max), and helpful. Never make up prices or details you don't know.`;

  const messages = [
    ...history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const response = await createAIClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    system: systemPrompt,
    messages,
  });

  const text =
    response.content[0].type === "text"
      ? response.content[0].text
      : "Sorry, I couldn't process that.";

  return NextResponse.json({ response: text });
}
