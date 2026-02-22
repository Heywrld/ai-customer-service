import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// GET /api/business — fetch current user's business profile
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({
    where: { clerkUserId: userId },
  });

  return NextResponse.json({ business });
}

// POST /api/business — create business (onboarding step 1–3 save)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, industry, city, systemPrompt, whatsappNumber } = body;

  if (!name) return NextResponse.json({ error: "Business name required" }, { status: 400 });

  // Upsert: create or update (idempotent so wizard can re-submit)
  const business = await db.business.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      name,
      industry: industry ?? null,
      city: city ?? "Lagos",
      systemPrompt: systemPrompt ?? null,
      whatsappNumber: whatsappNumber ?? null,
    },
    update: {
      name,
      industry: industry ?? undefined,
      city: city ?? undefined,
      systemPrompt: systemPrompt ?? undefined,
      whatsappNumber: whatsappNumber ?? undefined,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ business });
}

// PUT /api/business — update settings
export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const business = await db.business.update({
    where: { clerkUserId: userId },
    data: {
      name: body.name ?? undefined,
      industry: body.industry ?? undefined,
      city: body.city ?? undefined,
      systemPrompt: body.systemPrompt ?? undefined,
      whatsappNumber: body.whatsappNumber ?? undefined,
      phoneNumber: body.phoneNumber ?? undefined,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ business });
}
