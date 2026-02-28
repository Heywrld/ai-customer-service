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
 * Transcribe a URL-accessible audio file to text via Deepgram.
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

/**
 * Transcribe an audio buffer (e.g. downloaded with auth headers) to text via Deepgram.
 * Use this for AT recordings that require an API key header to download.
 */
export async function transcribeBuffer(audioBuffer: Buffer): Promise<string> {
  const deepgram = getClient();

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: "nova-2",
      language: "en",
      punctuate: true,
      smart_format: true,
    }
  );

  if (error) {
    console.error("[Deepgram] buffer transcription error:", error);
    return "";
  }

  return (
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ""
  );
}
