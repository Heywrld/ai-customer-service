import type { ModelRoute } from "./types";
import { calculateCost } from "./router";

export interface UsageRecord {
  businessId: string;
  conversationId?: string;
  model: ModelRoute;
  inputTokens: number;
  outputTokens: number;
  cacheHit: boolean;
  faqMatched: boolean;
  queryType: "simple" | "complex" | "summarize" | "faq" | "cached";
}

/**
 * Log AI usage to the database.
 * Imported lazily to avoid pulling Prisma into edge functions.
 */
export async function logUsage(record: UsageRecord): Promise<void> {
  const { db } = await import("@han/database");

  const costUsd = calculateCost(record.model, record.inputTokens, record.outputTokens);

  await db.aiUsage.create({
    data: {
      businessId: record.businessId,
      conversationId: record.conversationId,
      model: record.model,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      costUsd,
      cacheHit: record.cacheHit,
      faqMatched: record.faqMatched,
      queryType: record.queryType,
    },
  });
}
