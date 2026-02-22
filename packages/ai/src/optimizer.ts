import type { AIMessage } from "./types";
import { createAIClient } from "./client";

const SUMMARY_THRESHOLD = 6; // summarize when conversation exceeds this
const KEEP_RECENT = 4;        // always keep the last N messages verbatim

/**
 * If the conversation is long, summarize old messages with Haiku
 * (cheap) so Sonnet gets a compact context window.
 *
 * Returns { messages, summary } — messages is the optimized array to send.
 */
export async function optimizeConversation(
  messages: AIMessage[],
  existingSummary?: string | null
): Promise<{ messages: AIMessage[]; summary: string | null; didSummarize: boolean }> {
  if (messages.length <= SUMMARY_THRESHOLD) {
    return { messages, summary: existingSummary ?? null, didSummarize: false };
  }

  const toSummarize = messages.slice(0, messages.length - KEEP_RECENT);
  const recent = messages.slice(-KEEP_RECENT);

  const summaryPrompt = existingSummary
    ? `Previous summary: ${existingSummary}\n\nNew messages to add:\n${formatMessages(toSummarize)}`
    : `Summarize this customer service conversation in 2-3 sentences:\n${formatMessages(toSummarize)}`;

  const client = createAIClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{ role: "user", content: summaryPrompt }],
  });

  const summary =
    response.content[0].type === "text" ? response.content[0].text : null;

  // Prepend summary as a system-style context message
  const optimized: AIMessage[] = summary
    ? [{ role: "user", content: `[Earlier context]: ${summary}` }, ...recent]
    : recent;

  return { messages: optimized, summary, didSummarize: true };
}

function formatMessages(messages: AIMessage[]): string {
  return messages
    .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
    .join("\n");
}
