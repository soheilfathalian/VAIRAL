# Vairal

> **A founder-channel engine for underdog brands, driven by real AI-search data.**
> Built at the Big Berlin Hack — April 2026 — for the Peec AI hackathon track.

Vairal turns Peec AI's data on **how AI engines (ChatGPT, Gemini, Google AI Overview, Perplexity) talk about a brand** into a weekly UGC video production slate the brand's team can film and publish. Long-form briefs for citation, Shorts for reach, channel pitches for compounding distribution, source-gap actions for PR — every artifact grounded in a specific Peec data point.

It works for **any Peec project** the API key can see — Nothing Phone, Attio, BYD, BMW, your startup. No hardcoded brand list. Same product, any brand, real Peec data, no human in the loop.

---

## Why this matters

Founders compete with incumbents on both retail shelves and **AI answer surfaces**. Visibility on AI surfaces is determined by *which sources AI engines retrieve and cite*. Peec measures that precisely — but the gap from "we have a sentiment dashboard" to "what should we film next Tuesday?" is where most teams stall.

Vairal closes that gap. It turns dashboard rows into a **production calendar a one-person team can execute on a phone in a week.**

---

## What Vairal produces, from one Peec project

| Artifact | Grounded in | Output |
|---|---|---|
| **Headline insight** | `brand_report` (visibility, share-of-voice, sentiment, position) ranked vs. competitors with pre-computed pattern flags | Single-sentence strategic frame + 4 evidence pills |
| **6× Shorts scripts** | 3 competitor wedges = (worst-sentiment competitor, that competitor's weakest topic). 2 scripts per wedge. | Hook + claim + payoff + on-screen text + hashtags + shot list |
| **4× Combat Shorts** | Brand's own 4 worst-sentiment topics, per-topic `brand_report` | Transparent counter-narratives — turn weakness into messaging |
| **5× Channel pitches** | `url_report` aggregated by `channel_title`, ranked by retrievals + citations | Per-creator pitch angle, subject line, 3-paragraph email body |
| **5× Counter-narrative remixes** | Highest-retrievals URL where competitors are cited but our brand is not, body fetched via `urlContent` | 5 hooks + scripts that flip the source's argument |
| **5× Source gaps** | `domain_report` × competitor presence, scored `retrieved_pct × citation_rate × competitor_count`, LLM-judged to drop competitor-owned domains | Domain + classification + recommended action + content format |
| **CEO Q&A cluster** | Locked to Thursday: 09:00 Reddit AMA → 13:00 react Short → 19:00 react Short | Reddit post body + 2 reaction Shorts |
| **7-day calendar** | Pure-function planner: type-aware spreading, weekend penalty, urgent-news prioritization | One-click → teleprompter |

---

## What makes Vairal hard to copy

1. **AI-engine fanout sub-queries become YouTube chapter titles, 1:1.**
   Peec's `POST /queries/search` returns the internal sub-questions an AI engine fans out to while answering each prompt. Vairal uses these directly as chapter titles, with a mandatory `sub_query_source` field on each chapter. This is the deepest possible signal for citation-optimized long-form content, and almost nobody is using this endpoint.

2. **Code computes facts, the LLM only interprets.**
   Position is reversed (lower = better) — frontier LLMs and especially fallback models trip on this constantly. Vairal pre-computes ranks, leaders, and pattern flags (e.g. `BEST_POSITION_LOW_VISIBILITY`, `HIGH_SENTIMENT_LOW_VISIBILITY`) in TypeScript, then asks Gemini only to write the prose. See [`lib/pipeline/insight.ts`](./lib/pipeline/insight.ts).

3. **Three-model fallback chain with truncation recovery.**
   Free-tier preview models cap at ~25 requests/day. Vairal cascades `gemini-3.1-pro-preview → gemini-2.5-pro → gemini-2.5-flash-lite` with exponential backoff on the last hop, *and* recovers from mid-stream JSON truncation by regex-extracting fully-closed objects. The demo doesn't break at 429. See [`lib/llm/client.ts`](./lib/llm/client.ts).

4. **Every artifact traces back to a Peec data point.**
   Chapter title → real fanout sub-query. Pitch email → real cited video on that channel. Remix script → real URL with retrieval count > 0 in the last 30 days. Gap action → real `domain_report` row. Untraceable artifacts are rejected by the design.

5. **Twelve+ Peec endpoints used, not one or two.**
   `/projects`, `/brands`, `/topics`, `/tags`, `/models`, `/prompts`, `/chats`, `/chats/{id}/content`, `/reports/brands`, `/reports/domains`, `/reports/urls`, `/queries/search`, `/sources/urls/content`. Breadth + depth.

6. **No hardcoded brand list.**
   Every run fetches the live project list. Switch brands in the UI, regenerate in 30–60s, the whole slate changes. Works for any Peec project the API key has access to.

7. **Smart calendar planner is a pure function.**
   No LLM, no IO, fully deterministic. Q&A cluster pinned to Thursday. Type-aware spreading. Weekend overflow penalty. News-urgent items prioritized. Trivially testable, instantly previewable.

8. **Production-grade security posture for a hackathon.**
   - Pre-commit secret scanner (Peec / Gemini / Anthropic / Tavily / JWT / GitHub PAT / OpenAI key patterns) — pure shell, runs in <50 ms.
   - Aikido MCP wired in for on-demand SAST. Last full scan: zero issues across the 12 highest-risk files.
   - Entire session capture: every Claude Code session saved as a hidden checkpoint branch with `Entire-Checkpoint` commit trailers.

---

## Live evidence (Nothing Phone vs. Apple)

Peec data on the Nothing project shows the underdog dynamic clearly:

- Nothing has the **best avg position** in its category (2.39, ahead of Apple at 3.56) — **when AI mentions Nothing, it ranks Nothing higher**.
- But Nothing has only **19.9% visibility** vs. Apple's 50% — **AI rarely mentions Nothing in the first place**.
- Pattern flag fired: `BEST_POSITION_LOW_VISIBILITY` — distribution problem, not reputation problem.
- Vairal's response: a week of content targeting the topics where Nothing should appear but doesn't, plus pitches to the YouTube channels currently being cited for that category.

This is the exact signal-to-action loop the hackathon was designed to demonstrate.

---

## Architecture (one screen)

```
                       Peec REST API ─┐
                                      │
    User picks project ──► Pipeline ──┤      ┌─► Insight       (Gemini, facts pre-computed)
    in Next.js UI         (sequential ┼──────┼─► 6 Shorts      (Gemini + Tavily news anchor)
                          to stay     │      ├─► 5 Pitches     (Gemini, ranked YouTube channels)
                          under free- │      ├─► 5 Remixes     (Peec urlContent + Gemini)
                          tier RPM)   │      ├─► Q&A cluster   (Gemini)
                                      │      └─► 4 Combat      (Gemini, low-sent topics)
                       Gemini API ────┘
                                                          │
                       Tavily API ──► news + b-roll ──────┤
                                                          ▼
                                                   Slate JSON ──► generateSmartPlan ──► 7-day Calendar
                                                                                       │
                                                                              Click ──► Teleprompter (Spritz, WPM, drag)
```

Stack: TypeScript · Node 22 · Next.js 15 (App Router) · React 19 · Tailwind 3 · `@google/genai` · plain `fetch` for Peec & Tavily · zero database (slates are JSON files in `data/slate/`).

---

## Try it in 90 seconds

```sh
npm install
cp .env.example .env       # add PEEC_API_KEY (skc-…) and GEMINI_API_KEY (AIza…)
                           # optionally TAVILY_API_KEY (tvly-…) for news + b-roll

npm run explore            # smoke-test: lists brands, topics, top YouTube channels, fanout queries
npm run slate              # generate slate for the first accessible project (default: Nothing)
npm run slate "Attio"      # any substring match works
npm run slate or_xxxxxxxx  # raw project ID
npm run slate -- --list    # enumerate accessible projects

npm run dev                # demo UI on http://localhost:3000
```

In the UI: pick a brand from the dropdown → wait ~30–60s for the 5-step pipeline → walk through the calendar → click a Short → record it on the teleprompter. **Same flow works for every brand the API key can see.**

---

## Documentation

- **[AGENTS.md](./AGENTS.md)** — opinionated briefing for AI coding agents (what to do, what not to do).
- **[CODEBASE.md](./CODEBASE.md)** — full technical reference (file map, data flow, every Peec endpoint, every pipeline step's algorithm, recipes for extending).
- **[docs/peec/](./docs/peec/)** — concepts, metrics, REST API, MCP setup, all 27 MCP tools, the 7 native slash commands, use cases. Assembled while building Vairal.
- **[docs/tavily.md](./docs/tavily.md)** — optional freshness layer integration plan.

---

## Files worth opening first

| File | Why |
|---|---|
| [`lib/pipeline/types.ts`](./lib/pipeline/types.ts) | Every artifact shape in one file, ~120 lines. The contract. |
| [`lib/pipeline/slate.ts`](./lib/pipeline/slate.ts) | The orchestrator. 80 lines. Sequential by design. |
| [`lib/pipeline/insight.ts`](./lib/pipeline/insight.ts) | The "facts in code, prose by LLM" pattern. Position-rank trip-wire solved here. |
| [`lib/pipeline/long-form.ts`](./lib/pipeline/long-form.ts) | Fanout sub-query → chapter title 1:1 mapping. The killer technique. |
| [`lib/llm/client.ts`](./lib/llm/client.ts) | 3-model fallback chain + JSON truncation recovery. ~100 lines. |
| [`lib/peec/client.ts`](./lib/peec/client.ts) | Every Peec endpoint Vairal uses, in one typed wrapper. |
| [`lib/pipeline/planner.ts`](./lib/pipeline/planner.ts) | Pure-function 7-day calendar with weekend penalty and Q&A pinning. |
| [`app/page.tsx`](./app/page.tsx) | What the user actually sees. Server component, reads `latest.json`. |

---

## What's next (deliberately not shipped at the hackathon)

1. **Replay validation pipeline** — generate the brief Vairal *would have written* for an already-viral, already-cited video and side-by-side compare. Proves targeting precision, not just plausibility.
2. **MCP integration** — parallel client using `@modelcontextprotocol/sdk` so Vairal slots directly into Claude Code as a slash command.
3. **Cold-start mode** — for projects with <7 days of data, mine competitor-derived signals instead of own-brand blind spots.
4. **Suggestion bootstrap** — `/setup` page that one-clicks brand/topic/prompt suggestions for fresh projects. 10 min → 30 sec onboarding.

Hooks for each are described in [AGENTS.md](./AGENTS.md).

---

## License

MIT. Use it, fork it, point your own brand at it.

> The thesis: **distribution is the moat for early-stage brands fighting AI-search incumbents — and Peec data is precise enough to direct that distribution work down to the chapter title.** This codebase exists to prove the thesis works for any brand, not to be a polished product.
