import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";
import { z } from "zod";
import { PLAN_VOICE_ACCESS, DEFAULT_VOICE_ID, CURATED_VOICE_IDS } from "@/lib/plan";

// Nigerian display names for curated voices (cosmetic — voiceId is the real identifier)
export const VOICE_DISPLAY_NAMES: Record<string, string> = {
  "21m00Tcm4TlvDq8ikWAM": "Amaka",
  "AZnzlk1XvdvUeBnXmlld": "Funke",
  "EXAVITQu4vr4xnSDxMaL": "Chioma",
  "ErXwobaYiN019PkySvjV": "Emeka",
  "VR6AewLTigWG4xSOukaG": "Tunde",
};

const bodySchema = z.object({
  voiceId: z.string().min(1).max(100),
});

// PATCH /api/business/voice — update the authenticated business's voice
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid voiceId" }, { status: 400 });

  const { voiceId } = parsed.data;

  const business = await db.business.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, voiceId: true, plan: true },
  });

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Validate voice access against plan
  const access = PLAN_VOICE_ACCESS[business.plan] ?? "default";

  if (access === "default" && voiceId !== DEFAULT_VOICE_ID) {
    return NextResponse.json(
      { error: "Your plan only allows the default voice. Upgrade to choose a different voice." },
      { status: 403 }
    );
  }

  if (access === "curated" && !CURATED_VOICE_IDS.includes(voiceId)) {
    return NextResponse.json(
      { error: "That voice is not available on your plan. Upgrade to Pro for all voices." },
      { status: 403 }
    );
  }

  // "all" — no restriction

  const updated = await db.business.update({
    where: { id: business.id },
    data: { voiceId },
    select: { id: true, voiceId: true },
  });

  return NextResponse.json({ business: updated });
}

// GET /api/business/voice — get current voice for authenticated business
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({
    where: { clerkUserId: userId },
    select: { voiceId: true, plan: true },
  });

  return NextResponse.json({
    voiceId: business?.voiceId ?? DEFAULT_VOICE_ID,
    plan: business?.plan ?? "trial",
    access: PLAN_VOICE_ACCESS[business?.plan ?? "trial"] ?? "default",
  });
}
