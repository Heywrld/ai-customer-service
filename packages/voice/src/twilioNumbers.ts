import { createTwilioClient } from "./twilio";

export interface AvailableNumber {
  phoneNumber: string;      // e.g. "+2348031234567"
  friendlyName: string;     // e.g. "+234 803 123 4567"
  locality: string | null;  // e.g. "Lagos"
  region: string | null;
  monthlyPrice: string;     // e.g. "1.00" USD
}

export interface PurchasedNumber {
  sid: string;          // Twilio SID — store this for management
  phoneNumber: string;  // e.g. "+2348031234567"
  friendlyName: string;
}

/**
 * Search available Nigerian (+234) local numbers.
 * Returns up to `limit` numbers Twilio has in stock.
 */
export async function searchAvailableNumbers(limit = 5): Promise<AvailableNumber[]> {
  const client = createTwilioClient();

  const numbers = await client
    .availablePhoneNumbers("NG")
    .local.list({ limit });

  return numbers.map((n) => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality ?? null,
    region: n.region ?? null,
    monthlyPrice: n.phoneNumber ? "1.00" : "1.00", // Twilio NG local ~$1/mo
  }));
}

/**
 * Purchase a Nigerian number from Twilio and immediately configure
 * the voice webhook to point at Han's voice handler.
 * Returns the SID — store it on the business for future management.
 */
export async function purchaseNumber(
  phoneNumber: string,
  webhookBaseUrl: string
): Promise<PurchasedNumber> {
  const client = createTwilioClient();

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber,
    voiceUrl: `${webhookBaseUrl}/api/webhooks/voice`,
    voiceMethod: "POST",
    statusCallback: `${webhookBaseUrl}/api/webhooks/voice/status`,
    statusCallbackMethod: "POST",
  });

  return {
    sid: purchased.sid,
    phoneNumber: purchased.phoneNumber,
    friendlyName: purchased.friendlyName,
  };
}

/**
 * Release a number back to Twilio (e.g. on plan downgrade or cancellation).
 */
export async function releaseNumber(sid: string): Promise<void> {
  const client = createTwilioClient();
  await client.incomingPhoneNumbers(sid).remove();
}

/**
 * Update the voice webhook URL on an existing number (e.g. after domain change).
 */
export async function updateNumberWebhook(
  sid: string,
  webhookBaseUrl: string
): Promise<void> {
  const client = createTwilioClient();
  await client.incomingPhoneNumbers(sid).update({
    voiceUrl: `${webhookBaseUrl}/api/webhooks/voice`,
    voiceMethod: "POST",
  });
}
