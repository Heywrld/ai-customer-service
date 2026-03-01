import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";
import { createAIClient } from "@han/ai";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const ai = createAIClient();

  const aiResponse = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are generating starter FAQ entries for a Nigerian business's AI customer service system.

Business: ${business.name}
Industry: ${business.industry ?? "Retail"}
City: ${business.city ?? "Lagos"}
Description: ${business.systemPrompt ?? "A Nigerian business serving customers."}

Generate exactly 6 FAQs that customers commonly ask this type of business in Nigeria.
For each FAQ provide:
- "triggers": 4–5 short phrases a customer might type (mix English and Nigerian Pidgin)
- "response": a helpful 1–2 sentence answer relevant to this business
- "language": "en"

Return a JSON array only — no explanation, no markdown, no code block:
[
  {
    "triggers": ["do you deliver", "delivery", "where you deliver", "una dey deliver"],
    "response": "Yes, we deliver within Lagos and environs. Same-day delivery is available for orders placed before 2PM.",
    "language": "en"
  }
]`,
      },
    ],
  });

  const raw =
    aiResponse.content[0].type === "text" ? aiResponse.content[0].text.trim() : "[]";

  let items: { triggers: string[]; response: string; language: string }[] = [];
  try {
    // Strip markdown code fences if Claude added them despite instructions
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    items = JSON.parse(cleaned);
  } catch {
    console.error("[FAQ Generate] Failed to parse Claude response:", raw);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  const data = items
    .filter((item) => Array.isArray(item.triggers) && item.triggers.length > 0 && item.response)
    .map((item) => ({
      businessId: business.id,
      triggerPhrases: item.triggers.map((t) => t.toLowerCase().trim()),
      response: item.response,
      language: item.language ?? "en",
    }));

  await db.faqTemplate.createMany({ data, skipDuplicates: true });

  // Return the freshly created FAQs for the UI to display
  const created = await db.faqTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: data.length,
  });

  return NextResponse.json({ faqs: created, count: created.length });
}
