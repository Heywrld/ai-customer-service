# Han - AI Customer Service Platform

## Project Overview
Han is a voice and chat AI customer service platform built for Nigerian businesses.
Businesses onboard once; their customers get instant, intelligent support via WhatsApp and voice calls.

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Backend:** Next.js API Routes + tRPC
- **Database:** Neon PostgreSQL
- **Cache:** Upstash Redis
- **AI:** Claude API — Haiku (simple queries) + Sonnet (complex queries)
- **Messaging:** Twilio WhatsApp Business API
- **Voice:** Twilio Voice + Deepgram (speech-to-text) + ElevenLabs (text-to-speech)
- **Auth:** Clerk
- **Payments:** Paystack
- **Deployment:** Vercel

## Core Principles
1. **WhatsApp-first** — primary channel for Nigerian customers, not an afterthought
2. **Cost-optimized** — target $0.25/customer/month via 7 strategies (see .claude/COST-OPTIMIZATION.md)
3. **Nigerian market fit** — Pidgin support, Paystack, Lagos delivery zones, cultural tone
4. **Ship fast** — working software over perfect architecture

## Project Structure (Monorepo - Turborepo)
```
apps/
  web/              # Next.js dashboard + API routes
packages/
  ai/               # Claude integration + optimization layer
  voice/            # Twilio voice handling
  database/         # Prisma schema + migrations
  ui/               # Shared React components
.claude/            # Project context docs for Claude Code
```

## Key Files
- `.claude/ARCHITECTURE.md` — architectural decisions and patterns
- `.claude/COST-OPTIMIZATION.md` — all 7 cost reduction strategies
- `.claude/TASKS.md` — current sprint tasks
- `.claude/UIUX.md` — full UI/UX design system (colors, typography, animations, layouts, components)

## AI Pipeline (always follow this order)
```
User message
  → FAQ template matcher (no API call if match)
  → Redis cache check (no API call if hit)
  → Model router (Haiku vs Sonnet)
  → Conversation optimizer (summarize if >6 messages)
  → Prompt compressor
  → Claude API call
  → Cache response in Redis
  → Return to user
```

## Nigerian Context
- Detect Pidgin: wetin, dey, na, abeg, oya, wahala, shey, don
- Match customer tone (code-switch naturally)
- WhatsApp messages: keep short, use emojis, send order confirmations immediately
- Currency: always ₦ (Naira), amounts in kobo for Paystack (multiply by 100)
- Business hours: Mon-Fri 9AM-7PM, Sat 10AM-8PM WAT

## Environment Variables Needed
See `.env.example` for full list. Key ones:
- `ANTHROPIC_API_KEY`
- `DATABASE_URL` (Neon)
- `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`
- `DEEPGRAM_API_KEY`
- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` (optional, defaults to Rachel)
- `PAYSTACK_SECRET_KEY`
- `CLERK_SECRET_KEY`
