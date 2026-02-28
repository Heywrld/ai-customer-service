// Voice pipeline: Twilio (WhatsApp) + Africa's Talking (Voice) + ElevenLabs (TTS + STT)
export { createTwilioClient } from "./twilio";
export { transcribeAudio, transcribeBuffer } from "./deepgram";
export { listVoices, textToSpeech, streamTextToSpeech, speechToText } from "./elevenlabs";
export type { HanVoice } from "./elevenlabs";
export {
  searchAvailableNumbers,
  purchaseNumber,
  releaseNumber,
  updateNumberWebhook,
} from "./twilioNumbers";
export type { AvailableNumber, PurchasedNumber } from "./twilioNumbers";
