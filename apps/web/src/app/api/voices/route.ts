import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";
import { listVoices } from "@han/voice";
import { PLAN_VOICE_ACCESS, DEFAULT_VOICE_ID, CURATED_VOICE_IDS } from "@/lib/plan";

// Hardcoded fallback so the UI works even without an ElevenLabs key
const CURATED_FALLBACK = [
  { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Amaka", description: "Warm, professional female",      gender: "female" },
  { voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Funke", description: "Confident, energetic female",    gender: "female" },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Chioma", description: "Soft, friendly female",         gender: "female" },
  { voiceId: "ErXwobaYiN019PkySvjV", name: "Emeka", description: "Well-rounded, versatile male",   gender: "male"   },
  { voiceId: "VR6AewLTigWG4xSOukaG", name: "Tunde", description: "Deep, authoritative male",       gender: "male"   },
];

// Module-level cache — voices rarely change
let cachedElevenLabs: Awaited<ReturnType<typeof listVoices>> = [];
let cacheExpiry = 0;

async function getElevenLabsVoices() {
  if (Date.now() < cacheExpiry) return cachedElevenLabs;
  try {
    cachedElevenLabs = await listVoices();
    cacheExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  } catch {
    // No API key or network issue — return stale cache or empty
  }
  return cachedElevenLabs;
}

// GET /api/voices
// Returns the curated voice list with locked/unlocked state based on the
// business's plan. Pro+ also gets the full ElevenLabs library in `extended`.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({
    where: { clerkUserId: userId },
    select: { plan: true, voiceId: true },
  });

  const plan = business?.plan ?? "trial";
  const currentVoiceId = business?.voiceId ?? DEFAULT_VOICE_ID;
  const access = PLAN_VOICE_ACCESS[plan] ?? "default";

  const elevenLabsVoices = await getElevenLabsVoices();

  // Build curated set — always shown regardless of plan
  const curated = CURATED_FALLBACK.map((fallback) => {
    const live = elevenLabsVoices.find((v) => v.voiceId === fallback.voiceId);
    const isDefault = fallback.voiceId === DEFAULT_VOICE_ID;

    const locked =
      access === "default" ? !isDefault :
      access === "curated" ? false :
      false;

    const requiredPlan = locked
      ? (isDefault ? null : "business")
      : null;

    return {
      voiceId:     fallback.voiceId,
      name:        live?.name        ?? fallback.name,
      description: live?.description ?? fallback.description,
      gender:      live?.gender      ?? fallback.gender,
      previewUrl:  live?.previewUrl  ?? null,
      isDefault,
      locked,
      requiredPlan,
      selected: currentVoiceId === fallback.voiceId,
    };
  });

  // Pro+ gets every other ElevenLabs voice on top of curated
  const curatedSet = new Set(CURATED_VOICE_IDS);
  const extended = access === "all"
    ? elevenLabsVoices
        .filter((v) => !curatedSet.has(v.voiceId))
        .map((v) => ({
          voiceId:     v.voiceId,
          name:        v.name,
          description: v.description ?? "",
          gender:      v.gender       ?? null,
          previewUrl:  v.previewUrl   ?? null,
          isDefault:   false,
          locked:      false,
          requiredPlan: null,
          selected:    currentVoiceId === v.voiceId,
        }))
    : [];

  return NextResponse.json({ voices: curated, extended, access, currentVoiceId, plan });
}
