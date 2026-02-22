import { Redis } from "@upstash/redis";
import { createHash } from "crypto";

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

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
