# Han — UI/UX Design System

> Living document. Update as decisions are made. Every component, layout,
> and animation choice for Han lives here. Treat this as the single source
> of design truth across all sessions.

---

## Design Philosophy

**Tone:** Confident, warm, modern. Premium without being cold.
Think Stripe meets Lagos fintech — data-rich but never overwhelming.

**Guiding principles:**
1. Nigerian business owners check dashboards on phones — mobile-first always
2. Trust is earned through clarity — never hide costs, AI usage, or errors
3. Speed of understanding > visual richness — every screen answers "is it working?"
4. Delight through motion — purposeful animation, never decorative noise

---

## Brand Identity

### Logo Mark
Three ascending signal bars. Meaning: always available, growing signal.
- Never rotate, rearrange, or stretch
- See `assets/brand/HAN-ICON-SYSTEM-GUIDE.md` for full rules

### Icon Files (web-served from `apps/web/public/`)
| File | Use |
|------|-----|
| `favicon.svg` | Browser tab |
| `icons/han-icon-primary.svg` | Light mode UI (default) |
| `icons/han-icon-dark.svg` | Dark mode UI |
| `icons/han-icon-white.svg` | On colored/gradient backgrounds |
| `icons/han-icon-mono.svg` | Monochrome (print, embroidery) |
| `icons/han-icon-animated.svg` | Loading states, active indicators |
| `icons/han-icon-circle.svg` | Chat bubble avatar, badges |
| `icons/han-icon-rounded-bg.svg` | App launcher, widget |
| `icons/han-social-avatar.svg` | OG image, social profiles |

---

## Color System

### Primary Gradient (brand)
```css
--han-gradient: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
--sky-500: #0EA5E9;
--cyan-500: #06B6D4;
```

### Dark Mode Gradient (brighter, higher contrast)
```css
--han-gradient-dark: linear-gradient(135deg, #38BDF8 0%, #22D3EE 100%);
--sky-400: #38BDF8;
--cyan-400: #22D3EE;
```

### Neutral Scale (Tailwind slate)
```css
--slate-50:  #F8FAFC   /* page background light */
--slate-100: #F1F5F9   /* card background light */
--slate-200: #E2E8F0   /* borders light */
--slate-400: #94A3B8   /* muted text */
--slate-600: #475569   /* secondary text */
--slate-800: #1E293B   /* dark surface */
--slate-900: #0F172A   /* darkest surface / dark bg */
```

### Semantic Colors
```css
--success:  #22C55E   /* resolved conversations */
--warning:  #F59E0B   /* escalated, needs attention */
--error:    #EF4444   /* failed, unresolved */
--info:     #0EA5E9   /* neutral info (matches brand) */
```

### Tailwind Config Extension
```ts
colors: {
  brand: {
    50:  '#F0F9FF',
    100: '#E0F2FE',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  }
}
```

---

## Typography

### Font Stack
```css
/* Heading — sharp, modern, trustworthy */
font-family: 'Geist', 'Inter', system-ui, sans-serif;

/* Body — neutral, readable */
font-family: 'Geist', 'Inter', system-ui, sans-serif;

/* Mono — usage stats, token counts, code */
font-family: 'Geist Mono', 'JetBrains Mono', monospace;
```

### Scale
| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 4xl–6xl | 700 | Landing page hero |
| Heading 1 | 3xl | 700 | Page titles |
| Heading 2 | 2xl | 600 | Section titles |
| Heading 3 | xl | 600 | Card titles |
| Body | base (16px) | 400 | General copy |
| Small | sm (14px) | 400 | Metadata, timestamps |
| Micro | xs (12px) | 500 | Tags, badges, labels |
| Mono | sm | 400 | Costs (₦), token counts |

---

## Animation Strategy

### Three Tools, Three Jobs

| Tool | Job | Where |
|------|-----|--------|
| **Spline** | 3D hero scene (signal bars in 3D, floating/pulsing) | Landing page hero only |
| **Framer Motion** | Scroll reveals, micro-interactions, page transitions | Throughout app + landing |
| **Remotion** | Product demo video (rendered, not real-time) | "How it works" section on landing |

### Framer Motion Patterns

**Page enter (stagger children):**
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}
```

**Stat counter (scroll-triggered):**
```tsx
// Animate numbers from 0 to value when entering viewport
// Use useInView + useSpring from framer-motion
```

**Card hover:**
```tsx
whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(14,165,233,0.12)' }}
transition={{ duration: 0.2 }}
```

**Live conversation pulse (new message):**
```tsx
// Green dot, pulse ring animation on new incoming message
// Use han-icon-animated.svg for "AI is processing" state
```

### Spline Scene (Landing Hero)
- Subject: Han's three signal bars in 3D, centered, floating
- Interaction: subtle mouse parallax, continuous slow rotation
- Colors: brand gradient (#0EA5E9 → #06B6D4) with ambient glow
- Background: deep dark (#050A14) for maximum contrast
- Performance: lazy-load Spline, show static SVG until loaded

### Remotion Video (Product Demo)
- Length: 45–60 seconds
- Scene 1 (0–10s): Customer types "Abeg you get size 12?" on WhatsApp mockup
- Scene 2 (10–20s): Han signal bars animate (processing), response appears
- Scene 3 (20–35s): Dashboard view — conversation logged, cost shown (₦0.002)
- Scene 4 (35–45s): Stats: "47 chats handled today. ₦0.00 human cost."
- Style: dark bg, brand colors, kinetic text, no voiceover needed

---

## Routing Architecture

```
app/
  page.tsx                       ← Landing page (public)
  (auth)/
    sign-in/[[...sign-in]]/      ← Clerk
    sign-up/[[...sign-up]]/      ← Clerk
  (dashboard)/
    layout.tsx                   ← Protected shell (sidebar + nav)
    page.tsx                     ← Dashboard home
    conversations/
      page.tsx                   ← Conversation list
      [id]/page.tsx              ← Single conversation thread
    faqs/page.tsx                ← FAQ manager
    analytics/page.tsx           ← Costs + usage charts
    settings/page.tsx            ← Business profile + WhatsApp config
    onboarding/page.tsx          ← First-time setup wizard
```

---

## Landing Page

### Sections (in order)

#### 1. Hero
- Full-viewport Spline 3D scene (dark bg)
- Headline: `"Your customers deserve instant answers."`
- Subheadline: `"Han handles WhatsApp messages 24/7 so Nigerian businesses never miss a sale."`
- CTAs: `[Get Started →]` (primary) + `[See it in action ▶]` (ghost, opens demo video)
- Top nav: Han logo left, `[Sign In]` right, transparent over 3D scene

#### 2. Trust Bar
- Single row, subtle: `Speaks Pidgin ✓` · `WhatsApp Native ✓` · `Paystack Ready ✓` · `Lagos to Abuja ✓`

#### 3. How It Works
- 4 animated steps (Framer Motion stagger on scroll)
- Remotion demo video below steps (autoplay muted, loop)

#### 4. Live Demo (interactive, no sign-up)
- Headline: `"Try Han right now."`
- WhatsApp-style chat UI mockup
- User types a message → real Claude API call → Han responds
- Pre-seeded suggestion chips: "Do you deliver to Lekki?", "Wetin una get for size 12?", "How much be the delivery?"
- This is the #1 conversion driver — feel of the product before commitment

#### 5. Features
- 3-column grid (desktop), stacked (mobile)
- Feature 1: 24/7 availability — `han-icon-animated.svg`
- Feature 2: Speaks Pidgin — 🇳🇬 flag
- Feature 3: Cost dashboard — chart icon
- Feature 4: WhatsApp native — WhatsApp icon
- Feature 5: FAQ auto-match — zero cost tag
- Feature 6: Human takeover — hands icon

#### 6. Pricing
- 3 tiers: Starter / Growth / Scale
- Highlight middle tier (Growth) as recommended
- Show cost per customer per month prominently
- Nigerian Naira pricing (₦) — not just USD

#### 7. Footer CTA
- Dark section, gradient background
- `"Set up in 10 minutes. No developers needed."`
- Single CTA: `[Start Free →]`

---

## Dashboard

### Layout Shell

**Desktop (≥1024px):**
```
┌──────────┬──────────────────────────────────┐
│          │  Top bar: page title + actions   │
│ Sidebar  ├──────────────────────────────────┤
│ 240px    │                                  │
│          │  Page content                    │
│          │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Mobile (<1024px):**
- Sidebar collapses entirely
- Bottom navigation bar (4 icons): Home, Chats, FAQs, Settings
- Full-screen content area

### Sidebar Items
```
[Han logo + wordmark]

Navigation:
  🏠  Dashboard
  💬  Conversations   [live count badge]
  ⚡  FAQs
  📊  Analytics
  ⚙️  Settings

Bottom:
  [Business name + avatar]
  [Plan badge: Starter]
```

### Dashboard Home Screen
```
┌─────────────────────────────────────────────┐
│ Good morning, Adunola 👋                    │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │  47      │ │  ₦0.18   │ │  89%        │ │
│  │ Chats    │ │ Avg cost │ │ Resolved    │ │
│  │ today    │ │ per chat │ │ by AI       │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
│                                             │
│  AI Health                                  │
│  Haiku ███████░░░ 73%    Sonnet 27%         │
│  Cache hit rate ██████░░ 61%                │
│                                             │
│  Live Conversations                         │
│  ● Chioma  "my order never reach"   2m     │
│  ● Tunde   "do you get size 12?"    5m     │
│  ● Kemi    "payment not going thru" 8m     │
│                                             │
│  [View all conversations →]                 │
└─────────────────────────────────────────────┘
```

### Conversations Screen
- **Left panel (320px):** Scrollable list
  - Customer name + phone (masked: 0801***4521)
  - Last message preview (truncated)
  - Channel icon (WhatsApp green dot)
  - Time + status badge (`resolved` / `active` / `escalated`)
  - Pidgin tag 🇳🇬 when detected
- **Right panel:** Full chat thread
  - Customer messages: left-aligned, gray bubble
  - AI messages: right-aligned, brand-gradient bubble
  - Footer: model used (Haiku/Sonnet) + cost + cache hit indicator
  - `[Take Over Chat]` button (top right) — human handoff

### FAQ Manager Screen
- Header: `[+ Add FAQ]` button
- Card grid (2 col desktop, 1 col mobile)
- Each card:
  - Trigger phrases (chips/tags)
  - Response text (truncated, expand on click)
  - Hit counter: `Used 142 times`
  - Toggle: active/inactive
  - Edit / Delete actions
- Empty state: "Add your first FAQ — every match saves you money."

### Analytics Screen
- Date range picker (Today / 7d / 30d / Custom)
- Line chart: conversations + cost over time
- Donut chart: Haiku vs Sonnet split
- Savings callout: `"Han saved you ₦84,000 vs. a human agent this month"`
- Table: top customers by conversation count

### Onboarding Wizard (first-time)
- Step 1: Business info (name, industry, city)
- Step 2: What do you sell? (free-text, generates system prompt)
- Step 3: Connect WhatsApp (Twilio phone number setup)
- Step 4: Test your AI (live chat window, type a message)
- Completion: confetti + "Your AI is live" screen with WhatsApp number to share

---

## Component Patterns

### Stat Card
```tsx
<StatCard
  label="Chats today"
  value={47}
  delta="+12% vs yesterday"
  deltaType="positive"
  icon={<MessageCircle />}
/>
```
- White bg, subtle border, slight hover lift
- Delta: green up arrow / red down arrow / gray neutral

### Conversation List Item
```tsx
<ConversationItem
  customer="Chioma A."
  phone="0801***4521"
  preview="my order never reach"
  channel="whatsapp"
  status="active"
  usesPidgin={true}
  time="2m ago"
/>
```

### AI Response Bubble
- Brand gradient background
- Small footer: `Haiku · ₦0.001 · cached`

### Model Badge
```tsx
<ModelBadge model="haiku" />    // sky blue, "⚡ Haiku"
<ModelBadge model="sonnet" />   // purple, "🧠 Sonnet"
```

### FAQ Card
```tsx
<FAQCard
  triggers={["do you deliver", "delivery zone"]}
  response="We deliver to all Lagos zones..."
  hitCount={142}
  isActive={true}
/>
```

---

## Nigerian UX Specifics

- Currency: always `₦` (Naira), never `$` in Nigerian-facing UI
- Phone display: mask middle digits `0801***4521`
- Time: WAT (West Africa Time, UTC+1) — show local time always
- Pidgin indicator: 🇳🇬 flag tag, never a text label like "Pidgin detected"
- WhatsApp: use brand green (#25D366) for WhatsApp channel indicators
- Emoji use: acceptable and expected in dashboard copy — matches Nigerian communication style
- Empty states: always actionable ("Add your first FAQ — every match saves you money")

---

## Accessibility

- Minimum contrast: 4.5:1 for all text
- Focus rings: visible, brand-colored (`ring-sky-500`)
- Motion: respect `prefers-reduced-motion` — disable Framer Motion animations, show static SVG instead of Spline
- Touch targets: minimum 44×44px on mobile

---

## Packages to Install

```bash
# 3D hero
@splinetool/react-spline
@splinetool/runtime

# Scroll + micro animations
framer-motion

# Product demo video (separate workflow, install when needed)
remotion
@remotion/player

# Charts (analytics screen)
recharts

# Date picker (analytics)
react-day-picker
date-fns
```

---

**Version:** 1.0
**Last updated:** February 2026
**Maintained by:** Claude Code (update this file after every significant design decision)
