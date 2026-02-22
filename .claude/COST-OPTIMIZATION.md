# Cost Optimization Strategies

## Target
$0.25 per customer per month
Baseline without optimization: ~$1.50/customer/month
Target reduction: 83%

## Strategy 1: Model Routing (Est. savings: 60%)

Route by complexity before calling API.

```typescript
const SIMPLE_PATTERNS = [
  /do you have/i, /how much/i, /what time/i, /where are you/i,
  /wetin be/i, /how far/i, /you get/i, /price of/i,
  /open.*today/i, /when.*deliver/i, /track.*order/i
];

function routeModel(message: string): 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' {
  const isSimple = SIMPLE_PATTERNS.some(p => p.test(message));
  return isSimple ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6';
}
```

Pricing reference:
- Haiku: $0.80/1M input tokens, $4/1M output tokens
- Sonnet: $3/1M input tokens, $15/1M output tokens

Target split: 70% Haiku / 30% Sonnet

## Strategy 2: Response Caching (Est. savings: 30%)

Cache in Redis. Normalize query before hashing.

```typescript
function getCacheKey(businessId: string, message: string): string {
  const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ');
  const hash = createHash('md5').update(normalized).digest('hex');
  return `response:${businessId}:${hash}`;
}

// TTL: 24 hours for product/price queries
// TTL: 1 hour for time-sensitive (delivery status)
```

Target hit rate: 60%

## Strategy 3: FAQ Template Matching (Est. savings: 20%)

Match before ANY API call. Zero cost responses.

```typescript
// Per-business FAQ templates stored in DB
// Matched against incoming message
// If match: return template directly, log faq_matched=true

// Common templates to pre-seed:
// - Delivery zones + pricing
// - Return policy
// - Business hours
// - Payment methods accepted
// - Order tracking instructions
```

Target: Handle 20-30% of queries with zero API cost.

## Strategy 4: Prompt Compression (Est. savings: 10%)

System prompts must stay under 100 tokens.

```typescript
// Good (~80 tokens)
const buildPrompt = (b: Business) => `
You are ${b.name}'s customer service agent.
Products: ${b.productSummary}
Delivery: ${b.deliveryZones}
Tone: ${b.usesPidgin ? 'Nigerian Pidgin friendly' : 'Professional Nigerian English'}
`.trim();

// Never include: company history, lengthy instructions,
// repeated context, example conversations in system prompt
```

## Strategy 5: Conversation Memory Management (Est. savings: 15%)

Summarize long conversations with Haiku before Sonnet calls.

```typescript
// Trigger: message_count > 6
// Action: summarize messages 1 to (n-4) with Haiku
// Store: conversations.summary
// Use: summary + last 4 messages as context

// Cost: small Haiku call now saves larger Sonnet context later
```

## Strategy 6: Rate Limiting (Abuse prevention)

```typescript
const LIMITS = {
  perCustomerPerHour: 20,       // messages per customer
  perBusinessPerDay: 10000,     // total messages
};

// Implement with Upstash Redis INCR + EXPIRE
// Return polite message when limit hit (no API call)
```

## Strategy 7: Batching Non-Urgent Requests

For analytics, summaries, reports — batch and process off-peak.
Not applicable to real-time customer messages.
Use Vercel Cron or queue (e.g. Inngest) for batch jobs.

## Cost Monitoring

Log every AI call to `ai_usage` table:
```sql
SELECT
  DATE(created_at) as date,
  model,
  COUNT(*) as calls,
  SUM(input_tokens + output_tokens) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(cache_hit::int) * 100 as cache_hit_pct,
  AVG(faq_matched::int) * 100 as faq_match_pct
FROM ai_usage
WHERE business_id = $1
GROUP BY date, model
ORDER BY date DESC;
```

Dashboard at `/dashboard/costs` shows:
- Cost per day / per business
- Cache hit rate
- Model distribution (Haiku vs Sonnet %)
- FAQ match rate
- Optimization suggestions
