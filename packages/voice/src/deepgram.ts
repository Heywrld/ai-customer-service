import { createClient } from "@deepgram/sdk";

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) throw new Error("Missing DEEPGRAM_API_KEY");
    _client = createClient(apiKey);
  }
  return _client;
}

/**
 * Transcribe audio buffer (from Twilio recording URL or raw PCM) to text.
 * Returns the transcript string, or empty string on failure.
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const deepgram = getClient();

  const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
    { url: audioUrl },
    {
      model: "nova-2",
      language: "en",          // handles Nigerian English + Pidgin reasonably well
      punctuate: true,
      smart_format: true,
    }
  );

  if (error) {
    console.error("[Deepgram] transcription error:", error);
    return "";
  }

  return (
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ""
  );
}
