# Han - Sprint Tasks

## Sprint 1: Foundation (Current)

### Done
- [x] CLAUDE.md + project docs
- [x] Neon database created (project: still-forest-23971916)
- [x] Database schema: businesses, customers, conversations, messages, ai_usage, faq_templates

### Infrastructure
- [x] Initialize Turborepo monorepo
- [x] Set up Next.js app in apps/web
- [x] Configure Prisma with Neon connection string
- [x] Set up Upstash Redis
- [ ] Configure environment variables (.env.local)
- [ ] Vercel project setup

### AI Package (packages/ai)
- [x] Anthropic SDK client wrapper
- [x] Model router (Haiku vs Sonnet)
- [x] Redis cache layer (get/set with TTL)
- [x] FAQ template matcher
- [x] Prompt compressor (< 100 tokens)
- [x] Conversation summarizer (Haiku)
- [x] ai_usage logger

### WhatsApp Webhook (apps/web/api/webhooks/twilio)
- [x] Twilio signature validation middleware
- [x] Incoming message handler
- [x] Run full AI pipeline
- [x] Send response via Twilio API
- [ ] Handle media messages (images)

### Business Onboarding
- [x] Clerk auth setup (middleware + ClerkProvider + sign-in/up pages)
- [x] Business profile creation form (4-step wizard at /dashboard/onboarding)
- [x] Product/service info input (step 2 with system prompt generation)
- [x] WhatsApp number configuration (step 3)
- [ ] First FAQ templates setup (can add via FAQ manager after onboarding)

## Sprint 2: Core Dashboard

- [x] Conversation viewer (list at /dashboard/conversations + thread /conversations/[id])
- [ ] Customer list
- [x] Basic cost/usage stats (/dashboard/analytics)
- [x] FAQ template manager (CRUD at /dashboard/faqs)
- [x] Business settings page (/dashboard/settings)

## Sprint 3: Nigerian Market Features

- [ ] Pidgin detection + code-switching
- [ ] Paystack integration
- [ ] Lagos delivery zone calculator
- [ ] Order status updates via WhatsApp
- [ ] Voice call handling (Twilio + Deepgram)

## Backlog

- Email channel
- Instagram DMs
- Multi-language (Yoruba, Igbo, Hausa)
- A/B testing for prompts
- Advanced analytics
- Multi-agent handoff (AI → human)

---
## Neon DB Info
- Project ID: still-forest-23971916
- Branch: main (br-dawn-fog-aiwcfxam)
- Database: neondb
