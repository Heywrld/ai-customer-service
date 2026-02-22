# Architecture Decisions

## Stack Rationale

### Next.js 14 (App Router)
Full-stack in one repo. API routes handle webhooks (Twilio, Paystack).
Server components for dashboard performance. Edge functions for low latency.

### tRPC
End-to-end type safety between dashboard and API. No versioning overhead.
Auto-generated client from router definitions.

### Neon PostgreSQL
Serverless PostgreSQL. Branching for safe migrations. Free tier sufficient for early stage.
MCP integration allows Claude Code to query/migrate directly.

### Upstash Redis
Serverless, pay-per-request. Free tier: 10K commands/day.
Used exclusively for response caching. Key format: `response:{businessId}:{queryHash}`.

### Claude API (Haiku + Sonnet)
- Haiku: simple queries, summarization, FAQ expansion (~70% of traffic)
- Sonnet: complex multi-turn reasoning, complaints, edge cases (~30%)
Model selection happens in the router before any API call.

### Twilio
WhatsApp Business API (primary channel) + Voice API.
Webhook-driven: Twilio POSTs to our endpoint on every incoming message.

## Database Schema

### Core Tables
```
businesses     → tenants (one per client business)
customers      → end-users who message businesses
conversations  → a thread between one customer and one business
messages       → individual messages within a conversation
ai_usage       → every Claude API call logged for cost tracking
faq_templates  → per-business quick-match responses (no AI needed)
```

### Key Design Decisions
- `businesses.system_prompt` — custom AI persona per business
- `customers.uses_pidgin` — cached after first detection, persists
- `conversations.summary` — populated when message_count > 6 (memory optimization)
- `ai_usage.cache_hit` — tracks Redis hits for cost reporting
- `faq_templates.trigger_phrases` — array of strings, matched before any AI call

## AI Request Pipeline

```
Incoming message (WhatsApp webhook)
  │
  ├─ 1. FAQ Match
  │    triggerPhrases.some(p => message.includes(p))
  │    → Return template response immediately (no API call)
  │
  ├─ 2. Redis Cache Check
  │    key = hash(businessId + normalizedMessage)
  │    → Return cached response if hit (no API call)
  │
  ├─ 3. Model Router
  │    simplePhrases check → Haiku
  │    else → Sonnet
  │
  ├─ 4. Conversation Optimizer
  │    if messages.length > 6:
  │      summarize old messages with Haiku
  │      store summary in conversations.summary
  │      use only last 4 messages + summary
  │
  ├─ 5. Prompt Compressor
  │    system prompt < 100 tokens
  │    inject: name, products, delivery zones, tone
  │
  ├─ 6. Claude API Call
  │    log to ai_usage (model, tokens, cost, cache_hit=false)
  │
  └─ 7. Cache + Return
       store in Redis (TTL: 24h)
       send via Twilio WhatsApp
```

## Monorepo Structure

```
apps/
  web/
    app/
      (dashboard)/       # Protected business dashboard
      api/
        webhooks/
          twilio/        # Incoming WhatsApp + Voice
          paystack/      # Payment events
        trpc/            # tRPC router handler
    components/
    lib/

packages/
  ai/
    src/
      client.ts          # Anthropic SDK wrapper
      router.ts          # Model routing logic
      cache.ts           # Redis cache layer
      optimizer.ts       # Conversation summarization
      compressor.ts      # Prompt compression
      faq.ts             # Template matching
  voice/
    src/
      twilio.ts          # Twilio client
      stt.ts             # Deepgram speech-to-text
      tts.ts             # Text-to-speech
  database/
    prisma/
      schema.prisma
  ui/
    src/
      components/        # shadcn/ui + custom components
```

## Deployment

- Vercel: `apps/web` (auto-deploy on push to main)
- Neon: database (managed, auto-scaling)
- Upstash: Redis (managed, serverless)
- Twilio: external service (no deploy needed)

## WhatsApp Webhook Flow

```
Customer sends WhatsApp message
  → Twilio receives it
  → Twilio POST to /api/webhooks/twilio/whatsapp
  → We validate Twilio signature
  → Run AI pipeline
  → Twilio API call to send response
  → Log to ai_usage
```

Twilio requires a response within 10 seconds.
Use background jobs for anything slower.
