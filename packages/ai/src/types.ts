export type ModelRoute = "claude-haiku-4-5-20251001" | "claude-sonnet-4-6";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  model: ModelRoute;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  cacheHit: boolean;
  faqMatched: boolean;
}

export interface BusinessContext {
  id: string;
  name: string;
  systemPrompt?: string | null;
  industry?: string | null;
  city?: string | null;
}
