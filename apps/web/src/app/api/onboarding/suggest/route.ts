import { NextRequest, NextResponse } from "next/server";
import { createAIClient } from "@han/ai";

export async function POST(req: NextRequest) {
  const { name, industry, city } = await req.json();
  if (!name || !industry) {
    return NextResponse.json({ error: "name and industry are required" }, { status: 400 });
  }

  const ai = createAIClient();

  const response = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `You are helping a Nigerian business owner set up their AI customer service assistant.

Business name: ${name}
Industry: ${industry}
City: ${city ?? "Lagos"}, Nigeria

Write a 2–3 sentence description this business owner can use to describe what they sell. Requirements:
- Specific to ${industry} businesses in Nigeria
- Include typical products/services for this industry
- Include realistic Naira price ranges (₦) for this industry
- Mention delivery/service scope relevant to ${city ?? "Lagos"} if applicable
- Mention common Nigerian payment methods (bank transfer, POS, cash on delivery)
- Written from owner's perspective ("We sell…", "We offer…")
- No markdown, no bullet points — plain sentences only

Return ONLY the description. No preamble, no explanation.`,
      },
    ],
  });

  const description =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  return NextResponse.json({ description });
}
