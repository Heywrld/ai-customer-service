import { NextRequest, NextResponse } from "next/server";
import { getAudio } from "@/lib/audioCache";

// Serves ElevenLabs-generated MP3 audio for Twilio/AT to <Play>
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const buffer = getAudio(id);

  if (!buffer) {
    return new NextResponse("Audio not found or expired", { status: 404 });
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}
