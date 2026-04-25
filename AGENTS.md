# AGENTS.md

> Briefing for AI coding agents (Claude Code, Cursor, Codex, etc.) entering this repo.
> Read this first. It will save you hours.

## What this is

**Vairal** is a Peec-AI-driven content engine. For any brand tracked in Peec, it pulls AI-search visibility data and generates a weekly UGC video slate: one long-form YouTube brief, three Shorts scripts, five YouTube creator pitch emails — all grounded in real Peec data, not generic content marketing.

Built at the Big Berlin Hack (April 2026) for the Peec AI hackathon track.

## Core mental model

```
Peec API (REST) ──┐
                  ├──► Pipeline (4 sequential Gemini calls) ──► Slate JSON ──► Next.js UI
Gemini API ───────┘
```

**One brand = one Peec project = one slate.** Slates are content plans, not analytics dashboards. Every artifact in a slate must trace back to a specific Peec data point — chapter titles come from real ChatGPT fanout sub-queries, channel pitches come from real cited URLs, etc. **Never let the LLM invent unattributed content.**

## File map

| Path | Purpose |
|---|---|
| [`lib/peec/client.ts`](./lib/peec/client.ts) | Typed REST wrapper for Peec. Auth via `x-api-key` header. All endpoints documented in [`docs/peec/rest-api.md`](./docs/peec/rest-api.md) |
| [`lib/peec/types.ts`](./lib/peec/types.ts) | TypeScript types matching Peec response shapes |
| [`lib/peec/projects.ts`](./lib/peec/projects.ts) | Live project listing + name-to-id resolution. **No hardcoded brand list — fetches dynamically every call** |
| [`lib/llm/client.ts`](./lib/llm/client.ts) | Gemini wrapper with **3-model fallback chain** (3.1-pro-preview → 2.5-pro → 2.5-flash-lite). Critical because free-tier quota for 3.x preview models is ~25/day |
| [`lib/tavily/client.ts`](./lib/tavily/client.ts) | Real-time web search wrapper for [Tavily](https://tavily.com). Used by `scripts/tavily-demo.ts` to enrich Shorts wedges with fresh news. Not yet wired into the main pipeline — see [`docs/tavily.md`](./docs/tavily.md) for integration plan |
| [`lib/pipeline/insight.ts`](./lib/pipeline/insight.ts) | Headline insight generation. Code computes structured facts (ranks, leaders, pattern flags) → Gemini writes the prose. Done this way because Flash Lite can't reliably reason about reversed metrics like `position` (lower = better) |
| [`lib/pipeline/long-form.ts`](./lib/pipeline/long-form.ts) | Track A: picks blind-spot topic, pulls fanout sub-queries, generates YouTube brief with chapters mapped 1:1 to those sub-queries |
| [`lib/pipeline/shorts.ts`](./lib/pipeline/shorts.ts) | Track B: identifies 3 weakest-sentiment competitors and weakest topics per competitor, generates 3 Shorts scripts targeting those wedges |
| [`lib/pipeline/pitches.ts`](./lib/pipeline/pitches.ts) | Track C: aggregates YouTube channels from `get_url_report`, ranks by retrievals + citations, generates personalized pitch emails |
| [`lib/pipeline/slate.ts`](./lib/pipeline/slate.ts) | Orchestrator. Runs the 4 LLM calls **sequentially** (not parallel) to stay under Gemini free-tier RPM limits |
| [`lib/pipeline/types.ts`](./lib/pipeline/types.ts) | The `Slate` type — single source of truth for what gets persisted |
| [`scripts/generate-slate.ts`](./scripts/generate-slate.ts) | CLI entry. Accepts a project alias/name/id or `--list` |
| [`scripts/explore.ts`](./scripts/explore.ts) | Smoke test for Peec connection + sanity check |
| [`scripts/tavily-demo.ts`](./scripts/tavily-demo.ts) | Standalone demo of the Tavily freshness layer. Reads latest slate, enriches each Short wedge with fresh news. Run with `npm run tavily` |
| [`app/page.tsx`](./app/page.tsx) | Demo UI homepage |
| [`app/components/BrandPicker.tsx`](./app/components/BrandPicker.tsx) | Live project selector — fetches from `/api/projects` |
| [`app/api/generate/route.ts`](./app/api/generate/route.ts) | POST endpoint that triggers slate generation server-side |
| [`app/api/projects/route.ts`](./app/api/projects/route.ts) | GET endpoint returning the live project list from Peec |
| [`app/teleprompter/page.tsx`](./app/teleprompter/page.tsx) | Teleprompter mode for filming Shorts (URL-encoded script) |
| [`app/content-plan/page.tsx`](./app/content-plan/page.tsx) | Content planner view |
| [`docs/peec/`](./docs/peec/) | Full Peec AI reference: concepts, metrics, MCP, REST, use cases |
| [`docs/tavily.md`](./docs/tavily.md) | Tavily integration: use cases, demo output, full-pipeline wire-up plan |

## Stack

- TypeScript + Node 22 + Next.js 15 (App Router) + React 19 + Tailwind 3
- Gemini via `@google/genai` (NOT OpenAI/Anthropic)
- Peec REST API via plain `fetch` (no SDK)
- Tavily via plain `fetch` (no SDK) — optional freshness layer
- No database — slates are JSON files in `data/slate/`

## Critical invariants — DO NOT VIOLATE

1. **Sequential LLM calls only.** `lib/pipeline/slate.ts` deliberately runs the 4 Gemini calls back-to-back, not via `Promise.all`. Free-tier Gemini RPM is too low for 4 parallel calls. If you "optimise" by parallelizing, the demo breaks at 429.

2. **Compute facts in code, not in prompts.** When you need the LLM to reason about metrics, pre-compute the analysis (rankings, leaders, pattern detection) in TypeScript and pass *interpreted facts* to the LLM. The Flash Lite fallback model isn't strong enough to interpret raw numbers correctly (especially reversed metrics like `position` where lower is better).

3. **No hardcoded brand list.** `lib/peec/projects.ts` must fetch projects live every time. Earlier versions had `KNOWN_ALIASES` — that was removed for a reason. The system has to work for any Peec project the API key can see.

4. **Every artifact must cite its data source.** Chapter titles → fanout sub-query (with `sub_query_source` field). Pitch emails → reference the creator's actual cited video. If you can't trace a generated string back to Peec data, the demo loses its credibility.

5. **`.env` keys never go to git.** `.gitignore` covers `.env`. `.env.example` must use placeholders only (`skc-...`, `AIza...`). One earlier commit accidentally leaked the real keys to `.env.example` — Google's scanner revoked the Gemini key within hours and the Peec key had to be rotated. Don't repeat this.

## How to run

```sh
# First time
npm install
cp .env.example .env  # add real keys (don't commit them)

# Smoke test the Peec connection
npm run explore

# Generate a slate
npm run slate                          # default project (first in list)
npm run slate "Project 1 - Nothing Phone"
npm run slate attio                    # substring match works
npm run slate or_xxxxxxxx              # raw project ID
npm run slate -- --list                # enumerate accessible projects

# Enrich the latest slate with fresh news (Tavily)
npm run tavily                         # standalone freshness demo

# Run the demo UI
npm run dev                            # http://localhost:3000

# Typecheck
npm run typecheck
```

## How the pipeline picks targets (for new agents adding tracks)

- **Long-form topic selection** (`lib/pipeline/long-form.ts:pickBlindSpotTopic`): scores each topic by `max(competitor_visibility) - own_visibility`, picks highest gap. Then pulls top 5 prompts by volume in that topic and gets fanout sub-queries for each.
- **Shorts wedge selection** (`lib/pipeline/shorts.ts`): identifies 3 competitors with worst sentiment, then for each finds the topic where that competitor's sentiment is weakest. Each Short attacks one wedge.
- **Pitch ranking** (`lib/pipeline/pitches.ts`): pulls 200 URLs, filters to `youtube.com` URLs with `channel_title`, groups by channel, sorts by `(retrievals + citations)` descending, takes top 5.

## Common pitfalls

| Pitfall | Mitigation |
|---|---|
| Gemini 429 on parallel calls | Pipeline is sequential. Don't change. |
| Gemini 429 on the *fallback* model too | The chain ends at `gemini-2.5-flash-lite` which has 1000+/day quota. If even that fails, wait for daily reset or enable Cloud billing |
| `Cannot read properties of undefined (reading 'call')` in Next.js | Stale `.next` cache. `rm -rf .next && npm run dev` |
| `.js` extension imports break Next.js webpack | All internal TS imports use bare paths (no `.js`). tsx handles this fine via Bundler module resolution |
| Project has `is_own:true` brand missing | Pipeline falls back to first brand and warns; UI shows the substitute |
| Project has zero brand_report data | Pipeline throws a clear error explaining the cold-start situation (Peec needs ~7 days of scrape data) |
| Leaked API key in `.env.example` | Use placeholders, rotate keys via Peec dashboard / Google AI Studio |

## Peec data essentials

The 4 metrics Vairal cares about:

- **Visibility (0-1)**: % of relevant prompts where the brand appears. Higher = better.
- **Share of Voice (0-1)**: Brand's share of total mentions. Higher = better.
- **Sentiment (0-100)**: How positively the AI describes the brand. Higher = better.
- **Position (number, e.g. 2.39)**: Average rank within answers. **LOWER = better.** This trips up LLMs constantly — that's why insight.ts pre-computes ranks in code.

The killer endpoint nobody talks about: `POST /queries/search` returns the **fanout sub-queries** AI engines run internally while answering each prompt. Vairal uses these directly as YouTube chapter titles. See [`docs/peec/concepts.md`](./docs/peec/concepts.md) and [`docs/peec/use-cases.md`](./docs/peec/use-cases.md).

## Demo choreography (for posterity)

90-second flow:
1. Open localhost:3000 → walk through Insight → Track A chapters (point at "↳ from sub-query") → Track B hooks → Track C pitches with real channel names
2. Click a different brand button (Attio / BMW / etc.) → slate regenerates live in 30-60s
3. Punchline: "Same product, any brand, real Peec data, no human in the loop"

## Things still pending (good first PRs)

1. **Replay validation pipeline** — generate the brief Vairal *would have written* for a video that already went viral and got cited (e.g. Pete Matheson's "The Best Ecosystem You Should Use"). Side-by-side comparison proves targeting precision.
2. **MCP integration** — Vairal currently uses Peec's REST API. Building a parallel MCP client (using `@modelcontextprotocol/sdk`) would let Vairal slot directly into Claude Code as a slash command.
3. **Cold-start mode** — for projects with <7 days of data, generate a competitor-derived slate by mining what competitors win on, instead of computing the brand's own blind spots.
4. **Suggestion bootstrap** — `/setup` page that takes a fresh Peec project and one-click accepts brand/topic/prompt suggestions. Cuts onboarding from 10 min to 30 sec.

## Author intent

This repo was built to demonstrate a specific thesis: **distribution is the moat for early-stage brands fighting AI-search incumbents, and Peec data is precise enough to direct that distribution work down to the chapter title.** The codebase exists to prove the thesis works for any brand, not to be a polished product.

If you're an AI agent extending this, prioritize:
1. Sharper targeting precision (more Peec dimensions wired in)
2. More robust handling of edge-case projects (cold-start, missing brands, sparse data)
3. Deployable demo (currently localhost-only)

…over generic refactoring. The hackathon judges cared about the data-to-artifact loop, not about code prettiness.
