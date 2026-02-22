import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";
import { z } from "zod";

const bodySchema = z.object({
  voiceId: z.string().min(1).max(100),
});

// PATCH /api/business/voice — update the authenticated business's voice
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid voiceId" }, { status: 400 });
  }

  const business = await db.business.update({
    where: { clerkUserId: userId },
    data: { voiceId: parsed.data.voiceId },
    select: { id: true, voiceId: true },
  });

  return NextResponse.json({ business });
}

// GET /api/business/voice — get current voice for authenticated business
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { clerkUserId: userId },
    select: { voiceId: true },
  });

  return NextResponse.json({ voiceId: business?.voiceId ?? null });
}
