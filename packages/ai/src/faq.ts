export interface FAQTemplate {
  id: string;
  triggerPhrases: string[];
  response: string;
  language: string;
}

/**
 * Match an incoming message against FAQ templates.
 * Returns the response string if matched, null otherwise.
 * Zero AI cost — all string matching.
 */
export function matchFAQ(
  message: string,
  templates: FAQTemplate[]
): { matched: true; response: string; templateId: string } | { matched: false } {
  const normalized = message.toLowerCase().trim();

  for (const template of templates) {
    if (!template.triggerPhrases?.length) continue;

    const hit = template.triggerPhrases.some((phrase) =>
      normalized.includes(phrase.toLowerCase())
    );

    if (hit) {
      return {
        matched: true,
        response: template.response,
        templateId: template.id,
      };
    }
  }

  return { matched: false };
}
