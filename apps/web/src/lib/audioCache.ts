import { randomUUID } from "crypto";

const TTL = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, { buffer: Buffer; expiresAt: number }>();

// Prune expired entries every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of cache) {
    if (entry.expiresAt < now) cache.delete(id);
  }
}, TTL);

export function storeAudio(buffer: Buffer): string {
  const id = randomUUID();
  cache.set(id, { buffer, expiresAt: Date.now() + TTL });
  return id;
}

export function getAudio(id: string): Buffer | null {
  const entry = cache.get(id);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.buffer;
}
