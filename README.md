# Vairal

> Founder-channel engine for underdog brands. Driven by real AI search data from Peec AI.

Vairal turns Peec's data on how AI engines (ChatGPT, Gemini, Google AI Overview, etc.) talk about a brand into a weekly UGC video slate the brand's team can film and publish — long-form for citation, shorts for reach, channel pitches for compounding.

Built at the Big Berlin Hack. Works for any Peec project with a configured "own brand" (Nothing Phone, Attio, BYD, your startup, etc.).

## What it produces

For one brand, one week:

- **Track A — Long-form YouTube brief.** Title, hook, description, and 6 chapters where each chapter title is mapped 1:1 to a sub-query AI engines actually fan out to. B-roll plan and tags included.
- **Track B — Three Shorts scripts.** Each one targets a different competitor wedge: a topic where a major rival has weak sentiment in AI responses. Hook, claim, payoff, on-screen text, hashtags, shot list.
- **Track C — Channel pitch list.** Top 5 YouTube channels currently being cited by AI engines for the brand's category, ranked. Each pitch includes a custom subject line and email body referencing that creator's actual cited videos.

Every artifact traces back to a specific Peec data point — never generic content.

## Setup

```sh
npm install
cp .env.example .env  # fill in PEEC_API_KEY and GEMINI_API_KEY
npm run explore       # smoke test Peec connection
npm run slate         # generate slate for the default project (Nothing)
npm run slate attio   # generate for Attio
npm run slate or_xxx  # generate for any project_id
npm run dev           # demo UI on localhost:3000
```

## Stack

- TypeScript + Node 22
- Next.js 15 (App Router) + React 19 + Tailwind for the demo UI
- Peec AI REST API (`api.peec.ai/customer/v1`)
- Gemini 2.5 Pro for content generation (JSON mode)

## Why this works

Peec data on the Nothing project shows the underdog dynamic clearly: Nothing has the best avg position in its category (2.39, ahead of Apple at 3.56) — but only 19.9% visibility vs Apple's 50%. The brand wins when it shows up. The job is to make it show up more.

Vairal answers that with the next week of content production: precisely targeted, citation-optimized, and grounded in what AI engines are actually fanning out to right now.
