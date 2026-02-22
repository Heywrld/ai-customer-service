import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// GET /api/faqs
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ faqs: [] });

  const faqs = await db.faqTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { hitCount: "desc" },
  });

  return NextResponse.json({ faqs });
}

// POST /api/faqs
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "No business found" }, { status: 404 });

  const { triggerPhrases, response, language } = await req.json();

  if (!triggerPhrases?.length || !response) {
    return NextResponse.json({ error: "triggerPhrases and response required" }, { status: 400 });
  }

  const faq = await db.faqTemplate.create({
    data: {
      businessId: business.id,
      triggerPhrases,
      response,
      language: language ?? "en",
    },
  });

  return NextResponse.json({ faq }, { status: 201 });
}
