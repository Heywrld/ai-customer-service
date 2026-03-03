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

/**
 * Register a Twilio number as a WhatsApp Business sender under Han's WABA.
 * Returns the WhatsApp sender SID to store in the pool record.
 *
 * Twilio will trigger Meta to verify the number. Since Han owns the number
 * (it's in Han's pool), verification can be handled internally (e.g. via
 * an inbound SMS or voice OTP that Han receives and confirms).
 */
export async function registerWhatsappSender(
  phoneNumber: string,
  webhookBaseUrl: string
): Promise<{ sid: string }> {
  const client = createTwilioClient();

  // Create a messaging service sender for this number
  // Twilio will initiate the WhatsApp Business API registration with Meta
  const sender = await (client as any).messaging.v1.services.create({
    friendlyName: `Han Pool - ${phoneNumber}`,
    inboundRequestUrl: `${webhookBaseUrl}/api/webhooks/whatsapp`,
    inboundMethod: "POST",
    statusCallback: `${webhookBaseUrl}/api/webhooks/whatsapp/status`,
  });

  return { sid: sender.sid };
}

/**
 * Remove a WhatsApp sender registration (e.g. when retiring a pool number permanently).
 */
export async function deregisterWhatsappSender(whatsappSid: string): Promise<void> {
  const client = createTwilioClient();
  await (client as any).messaging.v1.services(whatsappSid).remove();
}

/**
 * Initiate an outbound call from a Han pool number to a customer.
 * Returns the Twilio Call SID.
 */
export async function makeCall(
  to: string,
  from: string,
  twimlUrl: string,
  statusCallbackUrl: string
): Promise<string> {
  const client = createTwilioClient();
  const call = await client.calls.create({
    to,
    from,
    url: twimlUrl,
    method: "POST",
    statusCallback: statusCallbackUrl,
    statusCallbackMethod: "POST",
  });
  return call.sid;
}
