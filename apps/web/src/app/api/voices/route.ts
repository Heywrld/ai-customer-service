import { NextResponse } from "next/server";
import { listVoices } from "@han/voice";

// Cache the voice list — it rarely changes
let cachedVoices: Awaited<ReturnType<typeof listVoices>> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    if (!cachedVoices || now > cacheExpiry) {
      cachedVoices = await listVoices();
      cacheExpiry = now + CACHE_TTL_MS;
    }
    return NextResponse.json({ voices: cachedVoices });
  } catch (err) {
    console.error("[/api/voices] Failed to fetch voices:", err);
    return NextResponse.json(
      { error: "Failed to load voices" },
      { status: 500 }
    );
  }
}
