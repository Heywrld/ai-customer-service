import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) throw new Error("Missing Upstash Redis credentials");

  _redis = new Redis({ url, token });
  return _redis;
}

function buildKey(businessId: string, message: string): string {
  const normalized = message.toLowerCase().trim().replace(/\s+/g, " ");
  const hash = createHash("md5").update(normalized).digest("hex");
  return `han:response:${businessId}:${hash}`;
}

const DEFAULT_TTL = 60 * 60 * 24; // 24 hours
const SHORT_TTL = 60 * 60;        // 1 hour (time-sensitive queries)

const TIME_SENSITIVE = [/track/i, /status/i, /when.*deliver/i, /order.*reach/i];

function getTTL(message: string): number {
  return TIME_SENSITIVE.some((p) => p.test(message)) ? SHORT_TTL : DEFAULT_TTL;
}

export async function getCached(
  businessId: string,
  message: string
): Promise<string | null> {
  try {
    const key = buildKey(businessId, message);
    return await getRedis().get<string>(key);
  } catch {
    // Cache failure should never break the main flow
    return null;
  }
}

export async function setCached(
  businessId: string,
  message: string,
  response: string
): Promise<void> {
  try {
    const key = buildKey(businessId, message);
    const ttl = getTTL(message);
    await getRedis().setex(key, ttl, response);
  } catch {
    // Non-critical — log but don't throw
  }
}

// ── Voice session helpers ─────────────────────────────────────────────────────
// Used for the two-phase voice flow: acknowledge instantly, process in background

export interface VoiceSession {
  recordingUrl: string;
  callerNumber: string;
  destinationNumber: string;
  businessId: string;
  startedAt: number;
}

export interface VoiceResult {
  text: string;
  conversationId: string | null;
}

export async function setVoiceSession(sessionId: string, data: VoiceSession): Promise<void> {
  try {
    await getRedis().setex(`han:voice:${sessionId}`, 300, JSON.stringify(data));
  } catch { /* non-critical */ }
}

export async function getVoiceSession(sessionId: string): Promise<VoiceSession | null> {
  try {
    const raw = await getRedis().get<string>(`han:voice:${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function setVoiceResult(sessionId: string, result: VoiceResult): Promise<void> {
  try {
    await getRedis().setex(`han:voice:${sessionId}:result`, 300, JSON.stringify(result));
  } catch { /* non-critical */ }
}

export async function getVoiceResult(sessionId: string): Promise<VoiceResult | null> {
  try {
    const raw = await getRedis().get<string>(`han:voice:${sessionId}:result`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Audio buffer cache ────────────────────────────────────────────────────────
// Stores ElevenLabs audio in Redis so /api/voice/audio/[id] can serve it
// and /api/tts can skip regenerating identical text+voice combos.

export async function cacheAudio(key: string, buffer: Buffer, ttlSeconds = 3600): Promise<void> {
  try {
    await getRedis().setex(`han:audio:${key}`, ttlSeconds, buffer.toString("base64"));
  } catch { /* non-critical */ }
}

export async function getCachedAudio(key: string): Promise<Buffer | null> {
  try {
    const base64 = await getRedis().get<string>(`han:audio:${key}`);
    return base64 ? Buffer.from(base64, "base64") : null;
  } catch { return null; }
}

// ── Pending voice callback helpers ────────────────────────────────────────────
// Used for the AT outbound callback flow: store AI response, deliver on callback call

export async function setPendingCallback(callerNumber: string, text: string): Promise<void> {
  try {
    await getRedis().setex(`han:cb:${callerNumber}`, 120, text);
  } catch { /* non-critical */ }
}

export async function getPendingCallback(callerNumber: string): Promise<string | null> {
  try {
    return await getRedis().get<string>(`han:cb:${callerNumber}`);
  } catch { return null; }
}

export async function clearPendingCallback(callerNumber: string): Promise<void> {
  try {
    await getRedis().del(`han:cb:${callerNumber}`);
  } catch { /* non-critical */ }
}
