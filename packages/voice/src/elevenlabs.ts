import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — warm, professional

let _client: ElevenLabsClient | null = null;

function getClient(): ElevenLabsClient {
  if (!_client) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");
    _client = new ElevenLabsClient({ apiKey });
  }
  return _client;
}

export interface HanVoice {
  voiceId: string;
  name: string;
  category: string; // "premade" | "cloned" | "generated"
  accent?: string;
  gender?: string;
  description?: string;
  previewUrl?: string; // audio sample URL — use for in-browser preview
}

/**
 * Fetch all voices available on this ElevenLabs account.
 * Returns premade + any cloned voices the account has created.
 * Results are safe to cache for ~1 hour (voices don't change often).
 */
export async function listVoices(): Promise<HanVoice[]> {
  const client = getClient();
  const { voices } = await client.voices.getAll();

  return voices.map((v) => ({
    voiceId: v.voiceId,
    name: v.name ?? "Unnamed",
    category: v.category ?? "premade",
    accent: v.labels?.["accent"],
    gender: v.labels?.["gender"],
    description: v.labels?.["description"],
    previewUrl: v.previewUrl ?? undefined,
  }));
}

/**
 * Convert text to MP3 audio buffer using a specific business voice.
 * Falls back to DEFAULT_VOICE_ID if none set.
 * @param text - The response text to speak
 * @param voiceId - Business's chosen ElevenLabs voice ID (from businesses.voice_id)
 */
export async function textToSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<Buffer> {
  const client = getClient();

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_turbo_v2_5", // ~300ms latency
    outputFormat: "mp3_44100_128",
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Transcribe audio buffer to text using ElevenLabs STT.
 * @param audioBuffer - MP3/WAV audio buffer from AT recording
 */
export async function speechToText(audioBuffer: Buffer): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  formData.append("file", blob, "recording.mp3");
  formData.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs STT error: ${res.status} ${err}`);
  }

  const data = await res.json() as { text: string };
  return data.text?.trim() ?? "";
}

/**
 * Stream TTS chunks directly (lower latency than buffering).
 * @param voiceId - Business's chosen ElevenLabs voice ID
 */
export async function streamTextToSpeech(
  text: string,
  onChunk: (chunk: Buffer) => void,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<void> {
  const client = getClient();

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_turbo_v2_5",
    outputFormat: "mp3_44100_128",
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  });

  for await (const chunk of audioStream) {
    onChunk(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
}
