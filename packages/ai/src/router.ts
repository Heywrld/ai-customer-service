import type { ModelRoute } from "./types";

// Patterns that indicate a simple, factual query answerable by Haiku
const SIMPLE_PATTERNS: RegExp[] = [
  // English - product/price
  /do you (have|sell|stock)/i,
  /how much (is|does|for)/i,
  /what('s| is) the price/i,
  /is .+ available/i,
  /what time/i,
  /when (do you|are you|will)/i,
  /where (are you|is the)/i,
  /do you (deliver|ship)/i,
  /how long (does|will)/i,
  /track.{0,10}order/i,
  /order (status|update)/i,
  /what (are your|is your).{0,20}hours/i,
  /payment method/i,
  /do you accept/i,
  // Nigerian Pidgin / Nigerian English
  /you get/i,
  /wetin be/i,
  /how much e be/i,
  /una dey deliver/i,
  /e go reach/i,
  /how far/i,
  /dem get/i,
  /una get/i,
  /price of/i,
  /e dey available/i,
];

// Messages that are clearly complex (complaints, returns, edge cases)
const COMPLEX_PATTERNS: RegExp[] = [
  /wrong (item|size|product|order)/i,
  /never (receive|arrive|come|reach)/i,
  /refund/i,
  /damaged/i,
  /not working/i,
  /complaint/i,
  /cancel.*order/i,
  /i want to complain/i,
  /una send wrong/i,
  /my order never reach/i,
  /make una refund/i,
];

export function routeModel(message: string): ModelRoute {
  // Explicit complex signals take priority
  if (COMPLEX_PATTERNS.some((p) => p.test(message))) {
    return "claude-sonnet-4-6";
  }

  // Short messages are almost always simple
  if (message.trim().split(/\s+/).length <= 8) {
    return "claude-haiku-4-5-20251001";
  }

  // Check simple patterns
  if (SIMPLE_PATTERNS.some((p) => p.test(message))) {
    return "claude-haiku-4-5-20251001";
  }

  // Default to Sonnet for anything ambiguous
  return "claude-sonnet-4-6";
}

// Cost per 1M tokens in USD
const MODEL_COSTS: Record<ModelRoute, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
};

export function calculateCost(
  model: ModelRoute,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  return (
    (inputTokens / 1_000_000) * costs.input +
    (outputTokens / 1_000_000) * costs.output
  );
}
