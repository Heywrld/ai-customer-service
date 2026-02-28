import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac } from "crypto";
import { textToSpeech } from "@han/voice";
import { cacheAudio, getCachedAudio } from "@han/ai";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

function secret() {
  return process.env.CLERK_SECRET_KEY ?? "han-tts-secret";
}

// Single ?p= param contains base64url(JSON({t, v, ts, sig})) — no & in URL
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p");
  if (!p) return new NextResponse("Bad request", { status: 400 });

  let t: string, v: string, ts: string, sig: string;
  try {
    const decoded = JSON.parse(Buffer.from(p, "base64url").toString("utf-8"));
    t = decoded.t;
    v = decoded.v ?? DEFAULT_VOICE_ID;
    ts = decoded.ts;
    sig = decoded.sig;
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  if (!t || !ts || !sig) return new NextResponse("Bad request", { status: 400 });

  const expected = createHmac("sha256", secret())
    .update(`${t}:${v}:${ts}`)
    .digest("hex");
  if (expected !== sig) return new NextResponse("Forbidden", { status: 403 });

  if (Date.now() - parseInt(ts) > 5 * 60 * 1000) {
    return new NextResponse("Expired", { status: 410 });
  }

  const text = Buffer.from(t, "base64url").toString("utf-8");

  const audioKey = createHash("md5").update(`${text}:${v}`).digest("hex");

  // Redis cache check — skip ElevenLabs if we've generated this before
  const cached = await getCachedAudio(audioKey);
  if (cached) {
    return new NextResponse(cached, {
      headers: { "Content-Type": "audio/mpeg", "Content-Length": cached.length.toString(), "Cache-Control": "no-store" },
    });
  }

  let audioBuffer: Buffer;
  try {
    audioBuffer = await textToSpeech(text, v);
  } catch (err) {
    console.error("[TTS] ElevenLabs error — voice:", v, "error:", err);
    return new NextResponse("TTS generation failed", { status: 500 });
  }

  cacheAudio(audioKey, audioBuffer).catch(() => null); // fire-and-forget, 1hr TTL

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}
