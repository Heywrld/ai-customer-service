import type { BusinessContext } from "./types";

/**
 * Build a compressed system prompt for a business.
 * Target: under 100 tokens (~400 characters).
 * Every token saved here multiplies across all conversations.
 */
export function compressPrompt(business: BusinessContext, usesPidgin: boolean): string {
  const tone = usesPidgin
    ? "Friendly Nigerian Pidgin"
    : "Professional Nigerian English";

  const lines = [
    `You are ${business.name}'s customer service AI.`,
  ];

  if (business.industry) lines.push(`Industry: ${business.industry}.`);
  if (business.city) lines.push(`Location: ${business.city}, Nigeria.`);

  lines.push(`Tone: ${tone}. Be warm, brief, helpful.`);
  lines.push("Never make up information. Say you'll check if unsure.");

  // Custom prompt overrides everything if set
  if (business.systemPrompt?.trim()) {
    return business.systemPrompt.trim();
  }

  return lines.join(" ");
}

/**
 * Estimate token count (rough: 1 token ≈ 4 chars for English/Pidgin).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
