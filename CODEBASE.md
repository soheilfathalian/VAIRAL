# CODEBASE.md

> Full technical reference for AI agents and human contributors entering this repo.
> Read this together with [AGENTS.md](./AGENTS.md) (which contains the shorter, opinionated briefing).
> This file is the **how everything works + how to interact with it** map.

---

## 0. Evaluator quick-scan

If you are auditing this repo against other Peec hackathon submissions, the eight points below are the load-bearing differentiators. Each is grounded in a specific file, not marketing copy.

| # | Differentiator | Verify in |
|---|---|---|
| 1 | **Fanout sub-queries → YouTube chapter titles, 1:1.** Uses Peec's `POST /queries/search` — the deepest citation signal in the API and rarely used. Each chapter carries a `sub_query_source` field. | [`lib/pipeline/long-form.ts`](./lib/pipeline/long-form.ts), [`lib/pipeline/types.ts:25-37`](./lib/pipeline/types.ts) |
| 2 | **Code computes facts, LLM only interprets.** Solves the reversed-position-metric trip wire that breaks naive LLM-only approaches. Pre-computes ranks + leaders + pattern flags. | [`lib/pipeline/insight.ts:59-108`](./lib/pipeline/insight.ts) |
| 3 | **3-model fallback chain + truncation recovery.** Cascades `gemini-3.1-pro-preview → 2.5-pro → 2.5-flash-lite` with backoff; regex-recovers complete objects from truncated JSON arrays. Demo doesn't 429 out. | [`lib/llm/client.ts:32-101`](./lib/llm/client.ts) |
| 4 | **Twelve+ Peec endpoints used, not one.** Projects, brands, topics, tags, models, prompts, chats, chat content, brand/domain/url reports, fanout search, URL content. Breadth + depth. | [`lib/peec/client.ts:39-62`](./lib/peec/client.ts) |
| 5 | **No hardcoded brand list.** Live `listProjects()` on every render. Works for any project the API key can see. | [`lib/peec/projects.ts`](./lib/peec/projects.ts) |
| 6 | **Every artifact traces to a Peec data point.** Chapter → fanout sub-query, pitch → real cited video, remix → real cited URL via `urlContent`, gap → real `domain_report` row. | Schema in [`lib/pipeline/types.ts`](./lib/pipeline/types.ts) — every artifact shape carries a provenance field |
| 7 | **Pure-function smart calendar planner.** No LLM, no IO, deterministic. Q&A pinned to Thursday, type-aware spreading, weekend penalty, news-urgent prioritization. Trivially testable. | [`lib/pipeline/planner.ts`](./lib/pipeline/planner.ts) |
| 8 | **End-to-end demo + production-grade security posture.** CLI + web UI + teleprompter for filming. Pre-commit secret scanner blocks 7 key patterns. Aikido MCP integrated. Entire session capture. | [`scripts/hooks/pre-commit`](./scripts/hooks/pre-commit), [AGENTS.md](./AGENTS.md) §Security |

If you are deciding which submission to advance, the test we recommend: open the demo, pick any brand the API key can see, regenerate the slate, click into a Short, hit "Record Take", and confirm the script in the teleprompter is rooted in a specific Peec data point you can point to. That's the loop other submissions don't close.

---

## 0.1 TL;DR

**Vairal** is a Next.js 15 + TypeScript hackathon project that turns Peec AI's "how AI engines talk about your brand" data into a **weekly UGC video production slate**: shorts scripts, channel pitch emails, source-gap actions, a 7-day content calendar, and a teleprompter to film the scripts.

```
Peec REST API ─┐
               ├─► Pipeline (Gemini, sequential calls) ─► Slate JSON ─► Next.js UI ─► Teleprompter
Gemini API ────┤
Tavily API  ───┘ (optional freshness + b-roll image layer)
```

- **One brand = one Peec project = one slate JSON** in `data/slate/`.
- `data/slate/latest.json` is what the UI reads on every page render.
- No database. No queue. No auth. Single-user demo.
- Stack: Next.js 15 App Router, React 19, Tailwind 3, TypeScript, Node 22, `@google/genai`, plain `fetch` for Peec/Tavily.

---

## 1. Mental model

1. The user picks a Peec project (= a brand the user's API key has access to).
2. Vairal pulls the last 30 days of Peec analytics for that project (`brandReport`, `domainReport`, `urlReport`, `topics`, `brands`).
3. **Code computes structured facts** (rankings, blind-spot topics, competitor sentiment wedges, source gaps, channel aggregates).
4. **Gemini interprets those facts into artifacts** — never raw metrics, always pre-digested.
5. The artifacts are bundled into a `Slate` JSON.
6. A non-LLM **planner** distributes those artifacts across a 7-day calendar with type-aware spreading.
7. The Next.js UI renders the calendar, gap cards, pitch cards, and a Spritz-style teleprompter for filming.

The fundamental rule: **every artifact must trace back to a Peec data point.** Chapter titles ⇒ fanout sub-query. Pitch emails ⇒ a real cited video on that channel. Remix scripts ⇒ a URL the AI is currently citing. If you cannot trace it, do not generate it.

---

## 2. Repository layout

```
vairal/
├── app/                          Next.js App Router
│   ├── api/
│   │   ├── generate/route.ts     POST: trigger slate generation
│   │   ├── projects/route.ts     GET:  list Peec projects
│   │   └── images/route.ts       GET:  Tavily b-roll image search
│   ├── components/
│   │   ├── BrandPicker.tsx       Project dropdown + fake progress bar
│   │   ├── ContentDetailView.tsx ContentCard (calendar tile) + ContentDetailModal
│   │   ├── GapCard.tsx           Source-gap row with mailto pitch button
│   │   └── PitchCard.tsx         Channel-pitch row with mailto preview
│   ├── teleprompter/page.tsx     Spritz-style word-by-word teleprompter
│   ├── layout.tsx                Root layout
│   ├── page.tsx                  Home: calendar + gaps + pitches
│   └── globals.css
│
├── lib/
│   ├── peec/
│   │   ├── client.ts             Typed REST wrapper around api.peec.ai/customer/v1
│   │   ├── types.ts              All Peec response shapes
│   │   └── projects.ts           Project resolution (id|name|substring), 60s cache
│   ├── llm/
│   │   └── client.ts             Gemini wrapper, 3-model fallback chain, JSON mode
│   ├── tavily/
│   │   └── client.ts             Tavily search wrapper (news + images)
│   └── pipeline/
│       ├── slate.ts              Orchestrator: 5 sequential generation steps
│       ├── insight.ts            Headline insight (facts in code, prose by LLM)
│       ├── shorts.ts             3 competitor wedges → 6 Shorts (2 per wedge)
│       ├── pitches.ts            Top 5 YouTube channels → personalized pitch emails
│       ├── remixes.ts            Counter-narrative scripts vs a competitor URL
│       ├── qna-cluster.ts        Reddit AMA + 2 reaction Shorts
│       ├── low-sentiment-shorts.ts  4 "combat" Shorts on the brand's worst topics
│       ├── gap-analysis.ts       Domain gap scoring + LLM judge filter
│       ├── long-form.ts          Track A YouTube brief (defined, NOT wired into slate.ts)
│       ├── planner.ts            Slate → 7-day calendar (pure function, no LLM)
│       └── types.ts              All artifact shapes, including Slate
│
├── scripts/
│   ├── generate-slate.ts         CLI: npm run slate [alias|name|or_id|--list]
│   ├── explore.ts                CLI: npm run explore — smoke test Peec
│   ├── tavily-demo.ts            CLI: npm run tavily — show fresh-news enrichment
│   ├── install-hooks.sh          Installs the pre-commit secret scanner
│   └── hooks/pre-commit          Blocks API keys from being committed
│
├── data/
│   ├── slate/                    Generated slates: <slug>-<timestamp>.json + latest.json
│   ├── cache/                    (reserved)
│   └── explore/                  (reserved for explore.ts artifacts)
│
├── docs/
│   ├── peec/                     Reference for the Peec AI tool (concepts, REST, MCP)
│   ├── tavily.md                 Tavily integration plan
│   └── reports/                  Audit reports
│
├── AGENTS.md                     Short briefing for AI coding agents (read first)
├── CODEBASE.md                   This file (full reference)
├── README.md                     Public-facing summary
├── .env / .env.example
├── package.json                  Dependencies + npm scripts
├── tsconfig.json                 Bundler module resolution; "@/*" path alias
├── tailwind.config.ts
└── next.config.ts
```

---

## 3. Environment variables

| Name | Required | Used by | Notes |
|---|---|---|---|
| `PEEC_API_KEY` | yes | `lib/peec/client.ts` | Sent as `x-api-key` header. Format `skc-…`. |
| `PEEC_BASE_URL` | no | `lib/peec/client.ts` | Defaults to `https://api.peec.ai/customer/v1`. |
| `PEEC_PROJECT_NOTHING` | only for `npm run explore` | `scripts/explore.ts` | Hardcoded smoke-test project ID. |
| `GEMINI_API_KEY` | yes for full slate | `lib/llm/client.ts` | Format `AIza…`. Without it, `generate-slate.ts` falls back to a "data-only" slate. |
| `GEMINI_MODEL_CHAIN` | no | `lib/llm/client.ts` | Comma-separated. Default: `gemini-3.1-pro-preview,gemini-2.5-pro,gemini-2.5-flash-lite`. |
| `TAVILY_API_KEY` | no (graceful fallback) | `lib/tavily/client.ts` | Format `tvly-…`. Without it, Shorts skip news enrichment and the b-roll endpoint returns `[]`. |

`.env` is gitignored. `.env.example` must contain placeholders only — the pre-commit hook (`scripts/hooks/pre-commit`) blocks any commit whose staged additions match real key patterns for Peec / Gemini / Anthropic / Tavily / JWT / GitHub PAT / OpenAI.

---

## 4. External APIs used

### 4.1 Peec AI — `api.peec.ai/customer/v1`

Wrapper: [`lib/peec/client.ts`](./lib/peec/client.ts). All calls use plain `fetch`, JSON body, `x-api-key` header. Responses are shaped `{ data: T[], totalCount?: number }` and the wrapper unwraps `.data`.

| Method | Path | Wrapper fn | Returns |
|---|---|---|---|
| GET | `/projects` | `peec.listProjects()` | `Project[]` |
| GET | `/brands?project_id=` | `peec.listBrands(pid)` | `Brand[]` (each has `is_own`) |
| GET | `/topics?project_id=` | `peec.listTopics(pid)` | `Topic[]` |
| GET | `/tags?project_id=` | `peec.listTags(pid)` | `Tag[]` |
| GET | `/models?project_id=` | `peec.listModels(pid)` | `Model[]` |
| GET | `/prompts?project_id=&topic_id=&limit=` | `peec.listPrompts(pid, opts)` | `Prompt[]` |
| GET | `/chats?project_id=&start_date=&end_date=` | `peec.listChats(pid, range)` | `ChatSummary[]` |
| GET | `/chats/{id}/content?project_id=` | `peec.getChat(pid, chatId)` | `ChatContent` |
| POST | `/reports/brands?project_id=` | `peec.brandReport(pid, body)` | `BrandReportRow[]` |
| POST | `/reports/domains?project_id=` | `peec.domainReport(pid, body)` | `DomainReportRow[]` |
| POST | `/reports/urls?project_id=` | `peec.urlReport(pid, body)` | `UrlReportRow[]` |
| POST | `/queries/search?project_id=` | `peec.fanoutSearch(pid, body)` | `FanoutQuery[]` ← **the killer endpoint** |
| POST | `/sources/urls/content?project_id=` | `peec.urlContent(pid, {url})` | `UrlContent` |

Common request body for the report endpoints:

```ts
{
  start_date: "YYYY-MM-DD",
  end_date:   "YYYY-MM-DD",
  limit?: number,
  offset?: number,
  dimensions?: string[],
  filters?: { topic_ids?: string[], tag_ids?: string[], … }
}
```

Use `dateRange(days)` from [`lib/peec/client.ts`](./lib/peec/client.ts) to build the range. Default in slate generation is **30 days**.

### 4.2 Gemini — `@google/genai`

Wrapper: [`lib/llm/client.ts`](./lib/llm/client.ts).

```ts
generateJSON<T>({ system, user, maxTokens?, temperature? }): Promise<T>
```

Behaviour:
- Always JSON mode (`responseMimeType: "application/json"`).
- Iterates `MODEL_CHAIN`. Each non-final model gets 1 attempt; the last model gets 4 attempts with exponential backoff (`1500 * 2^a + jitter`).
- On non-quota errors mid-chain, falls through to the next model (with a warning) instead of throwing.
- Strips ```` ```json ```` fences if present.
- **Truncation recovery** for arrays: if `JSON.parse` fails on a string starting with `[`, regex-extracts every fully-closed `{…}` and returns the recovered objects. This is critical for the 6-Shorts payload on Flash Lite.
- `hasLLM` boolean is exported so callers (e.g. `scripts/generate-slate.ts`) can branch to a data-only mode.

### 4.3 Tavily — `https://api.tavily.com/search`

Wrapper: [`lib/tavily/client.ts`](./lib/tavily/client.ts). Plain `fetch`, API key in body. Two consumers:
1. `lib/pipeline/shorts.ts` — `topic: "news", days: 14, max_results: 1` → adds `fresh_news_anchor` to each Short.
2. `app/api/images/route.ts` — `include_images: true` → portrait b-roll for the modal.

`hasTavily` boolean is exported; both consumers gracefully degrade if the key is absent.

---

## 5. Pipeline deep-dive

Orchestrator: [`lib/pipeline/slate.ts`](./lib/pipeline/slate.ts).

```
generateSlate(projectId, days=30)
  ├─ parallel fetch: brands, topics, brandReport, domainReport, urlReport
  ├─ pick `is_own` brand (fallback: first brand, with warning)
  ├─ computeGapAnalysis (non-LLM scoring + LLM judge filter)
  ├─ Step 1/5  insight       (sequential, blocks)
  ├─ Step 2/5  shorts        (sequential, blocks)
  ├─ Step 3/5  pitches       (sequential, blocks)
  ├─ Step 4/5  remixes       (sequential, blocks)
  └─ Step 5/5  Promise.all([qna_clusters, low_sentiment_shorts])  (allowed to parallelize, both are cheap)
```

**Sequentiality is a hard invariant.** Free-tier Gemini RPM cannot sustain 4 parallel calls; do not "optimize" with `Promise.all` across the main steps.

### 5.1 Insight — `buildInsight`

[`lib/pipeline/insight.ts`](./lib/pipeline/insight.ts)

1. Find the brand's row in `brandReport`. If missing, return a friendly placeholder (means `is_own` flag isn't set on any brand).
2. **In code**: rank the brand on visibility, share-of-voice, sentiment, and **position (lower = better)**. Identify category leaders. Raise pattern flags:

```
BEST_POSITION_LOW_VISIBILITY        rank 1 on position AND visibility < 30%
HIGH_VISIBILITY_BAD_POSITION        rank 1 on visibility AND position rank > median
HIGH_SENTIMENT_LOW_VISIBILITY       sentiment ≥ 75 AND visibility < 20%
LOW_SENTIMENT                       sentiment < 55
DOMINANT_SOV                        rank 1 on share of voice
INVISIBLE_AND_LOW_RANKED            both visibility and position rank below median
```

3. Pass the structured fact bundle to Gemini, which produces `{ headline, subhead, evidence[] }`.

The system prompt explicitly instructs the LLM to *interpret*, not recompute. This is why insights work even on Flash Lite.

### 5.2 Shorts — `buildShorts`

[`lib/pipeline/shorts.ts`](./lib/pipeline/shorts.ts)

1. From `brandReport`, take the 3 competitors with the **worst sentiment** (filtered to those with visibility > 0.1, so we don't pick a noise brand).
2. For each competitor, fetch a per-topic `brandReport` for every topic and pick the topic where that competitor's sentiment is **weakest** (and visibility > 0.05 in that topic).
3. Send the 3 wedges to Gemini, asking for **2 distinct Shorts per wedge = 6 total**.
4. **Optional Tavily enrichment**: for each Short, query `"<competitor> criticism review problems controversy"`, news topic, last 14 days, `max_results: 1`. Attach `fresh_news_anchor` if found. Failure is swallowed with a warning.

Output: `ShortScript[]` of length 6 (or close — Flash Lite occasionally truncates and recovery falls short).

### 5.3 Pitches — `buildPitches`

[`lib/pipeline/pitches.ts`](./lib/pipeline/pitches.ts)

1. `urlReport(limit: 200)` → filter to `youtube.com` URLs that have a `channel_title`.
2. Group by channel. For each channel, sum `retrievals` and `citations`, keep the list of cited videos with their counts.
3. Sort by `total_retrievals + total_citations` descending. Keep top 5.
4. Send to Gemini with `maxTokens: 16384` (pitches are wordy). Each output object pins `channel_title`, `channel_url`, `why_it_matters`, `pitch_angle`, `email_subject`, `email_body` (3 short paragraphs).

### 5.4 Remixes — `buildRemixes`

[`lib/pipeline/remixes.ts`](./lib/pipeline/remixes.ts)

1. From the precomputed `urlReport`, find the highest-`retrievals` URL whose `mentioned_brands` contains a **competitor but NOT the own brand**.
2. `peec.urlContent(url, max_length: 5000)` to fetch the actual page text.
3. If content is empty / under 100 chars, return `[]`.
4. Send the source content + competitor list to Gemini, request **5 counter-narrative scripts** (each `{ source_url, hook, remix_angle, script, format }`).

### 5.5 Q&A cluster — `buildQnaClusters`

[`lib/pipeline/qna-cluster.ts`](./lib/pipeline/qna-cluster.ts)

LLM-only, no Peec data. Produces exactly one `QnaCluster` containing a Reddit AMA seed post and two reaction Shorts. The planner pins this triad to **Thursday at 09:00 / 13:00 / 19:00**.

### 5.6 Low-sentiment Shorts — `buildLowSentimentShorts`

[`lib/pipeline/low-sentiment-shorts.ts`](./lib/pipeline/low-sentiment-shorts.ts)

1. For every topic, fetch a per-topic `brandReport` and read the **own brand's sentiment** in that topic.
2. Sort ascending, take the worst 4 topics.
3. Ask Gemini for one combat Short per weak topic (output array length = topics provided).

### 5.7 Source-gap analysis — `computeGapAnalysis`

[`lib/pipeline/gap-analysis.ts`](./lib/pipeline/gap-analysis.ts) — runs **before** the LLM steps and contributes to the slate.

1. From the precomputed `domainReport`, drop rows where `classification === "You"` or where the own brand is already mentioned.
2. Keep rows where at least one tracked competitor is mentioned.
3. Score each: `gap_score = retrieved_percentage × citation_rate × competitor_count`.
4. Map `classification` (UGC / EDITORIAL / CORPORATE / REFERENCE / INSTITUTIONAL / OTHER) → `recommended_action` + `content_format` via the static `ACTION_MAP`.
5. Take top 15 by score.
6. **LLM judge pass** (`temperature: 0.1`): asks Gemini to drop competitor-owned domains (`samsung.com` for a phone brand) and unpitchable marketplaces (`amazon.com`), returning a string array of approved domains.
7. Return top 5 of the filtered list with a human summary.

### 5.8 Long-form brief — `buildLongFormBrief`

[`lib/pipeline/long-form.ts`](./lib/pipeline/long-form.ts) is **defined but not wired into `generateSlate`**. The CLI and UI do not currently produce a Track A YouTube brief. To enable, import it in `slate.ts`, run sequentially, add a field to `Slate`. Targeting algorithm:

1. `pickBlindSpotTopic`: for each topic, compute `max(competitor_visibility) − own_visibility`, pick the highest gap.
2. Pull top 5 prompts in that topic by volume.
3. For each prompt, call `peec.fanoutSearch` to get the AI engines' sub-queries; flatten and dedupe to 8.
4. Pull top YouTube channels and authoritative articles from `urlReport`.
5. LLM produces a brief with chapters mapped 1:1 to fanout sub-queries (`sub_query_source` field is mandatory — that is the entire point of Track A).

---

## 6. Slate JSON schema

[`lib/pipeline/types.ts`](./lib/pipeline/types.ts) is the single source of truth. Top-level shape:

```ts
type Slate = {
  generated_at: string;                       // ISO timestamp
  brand: { id: string; name: string };
  project_id: string;
  date_range: { start_date: string; end_date: string };
  headline_insight: Insight;                  // { headline, subhead, evidence[] }
  shorts: ShortScript[];                      // ~6, with optional fresh_news_anchor
  remixes: RemixScript[];                     // ~5
  pitches: ChannelPitch[];                    // ~5
  gap_analysis: GapAnalysis;                  // top 5 gaps + summary
  qna_clusters: QnaCluster[];                 // exactly 1
  low_sentiment_shorts: ShortScript[];        // up to 4
  replay?: ReplayValidation;                  // not populated yet
};
```

`ContentItem` and `WeeklyContentPlan` are derived shapes used by the planner — never persisted.

---

## 7. The smart calendar planner

[`lib/pipeline/planner.ts`](./lib/pipeline/planner.ts) is a **pure function** that takes a `Slate` and returns a `WeeklyContentPlan`. No LLM, no IO.

Algorithm:
1. **Map** shorts → `ContentItem` (urgent if `fresh_news_anchor` is set), remixes → `ContentItem`, low-sentiment shorts → `ContentItem`.
2. **Find Thursday** within the next 7 days (offset 0–6).
3. **Pin** the Q&A cluster: Reddit post at 09:00, react #1 at 13:00, react #2 at 19:00.
4. **Interleave** low-sentiment + competitor-attack queues to spread types out.
5. **First pass**: assign 1 item per non-Thursday day to guarantee daily cadence.
6. **Second pass**: distribute leftovers preferring days with fewer items, penalizing same-type duplicates (-5) and weekend overflow (-20 for the 2nd item on Sat/Sun).
7. **Per-day sort**: combat low-sentiment first, then assign times in order from `[09, 13, 18]`.

Output `items[]` with `id`, `scheduled_at`, `status: "PLANNED"`. The UI renders it directly into a 7-column grid.

---

## 8. The Next.js UI

### 8.1 Pages

| Route | File | Type | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Reads `data/slate/latest.json`, calls `generateSmartPlan`, renders Header → BrandPicker → 7-day calendar → gap cards → pitch cards → footer. `dynamic = "force-dynamic"`. |
| `/teleprompter` | `app/teleprompter/page.tsx` | Client | Spritz word-by-word display. Reads `?script=…` from URL. WPM 50–450, draggable position, font size, spacebar play/pause. Settings persisted in `localStorage` as `vairal-teleprompter-settings`. |

### 8.2 API routes

All `runtime: "nodejs"` (these touch the filesystem and Node-only fetch envs):

| Route | Method | Body / Query | Effect |
|---|---|---|---|
| `/api/projects` | GET | — | Returns `{ projects: ProjectInfo[] }` from Peec. |
| `/api/generate` | POST | `{ project: string }` (id\|name\|substring) | Resolves project, runs `generateSlate`, writes `data/slate/<slug>-<timestamp>.json` and `data/slate/latest.json`. Returns `{ ok, brand, project }`. `maxDuration: 120`. |
| `/api/images` | GET | `?topic=…` | Returns `{ images: string[] }` from Tavily portrait search. Empty array if `TAVILY_API_KEY` is missing. |

### 8.3 Components

- **`BrandPicker`** ([app/components/BrandPicker.tsx](app/components/BrandPicker.tsx)) — fetches `/api/projects` on mount, dropdown selects a project, POSTs `/api/generate`, drives a fake 0→95% progress bar (real progress would need streaming), `router.refresh()` on success.
- **`ContentCard`** + **`ContentDetailModal`** ([app/components/ContentDetailView.tsx](app/components/ContentDetailView.tsx)) — calendar tile + click-through modal. Tile carries platform icons, "done" checkbox in `localStorage` keyed `done:<itemId>`, badges for `is_low_sentiment` / `is_competitor_attack`. Modal contains 5 hook variants in a carousel, the script (with the chosen hook substituted in), Tavily b-roll strip with a lightbox, "Record Take" link to the teleprompter, "Copy Script" button.
- **`PitchCard`** ([app/components/PitchCard.tsx](app/components/PitchCard.tsx)) — channel pitch row with `mailto:?subject=…&body=…` and a collapsible email body preview.
- **`GapCard`** ([app/components/GapCard.tsx](app/components/GapCard.tsx)) — gap row with classification color, urgency bar (red/amber/green), competitor pills, "Pitch Domain" `mailto:` button pre-filled with gap context.

### 8.4 Data flow when a user clicks "Generate"

```
BrandPicker                       /api/generate                     filesystem
  │                                    │                                │
  │  POST {project}                    │                                │
  ├───────────────────────────────────►│                                │
  │                                    │  resolveProject(input)         │
  │                                    │  generateSlate(projectId):     │
  │                                    │    Peec fetches in parallel    │
  │                                    │    computeGapAnalysis          │
  │                                    │    insight  (Gemini)           │
  │                                    │    shorts   (Gemini + Tavily)  │
  │                                    │    pitches  (Gemini)           │
  │                                    │    remixes  (Peec + Gemini)    │
  │                                    │    qna+lowSent (parallel)      │
  │                                    │  writeFile slug-stamp.json     │
  │                                    │  writeFile latest.json         │
  │                                    │  return {ok, brand, project}   │
  │  ◄─────────────────────────────────┤                                │
  │  router.refresh()                  │                                │
  │                                                                     │
  │  next render reads latest.json (server) → generateSmartPlan → render │
```

---

## 9. CLI scripts

```sh
npm install                 # also installs the pre-commit hook via prepare
cp .env.example .env        # fill PEEC_API_KEY, GEMINI_API_KEY, optionally TAVILY_API_KEY

npm run explore             # smoke-test Peec on PEEC_PROJECT_NOTHING
npm run slate               # generate slate for first accessible project
npm run slate -- --list     # list accessible Peec projects
npm run slate "Attio"       # substring match
npm run slate or_xxxxxxxx   # raw project ID
npm run tavily              # standalone Tavily freshness demo against latest.json

npm run dev                 # demo UI on http://localhost:3000
npm run build && npm start
npm run typecheck           # tsc --noEmit
```

---

## 10. Persistence

| Path | Created by | Lifetime |
|---|---|---|
| `data/slate/<brand-slug>-<iso-timestamp>.json` | `npm run slate` and `/api/generate` | kept indefinitely (history) |
| `data/slate/latest.json` | both of the above | overwritten each run; the only file the UI reads |
| `localStorage["done:<itemId>"]` | `ContentCard` | per-browser |
| `localStorage["vairal-teleprompter-settings"]` | teleprompter page | per-browser |

There is no database, no migration, no schema versioning. If you change `Slate`, you must regenerate.

---

## 11. How to interact (recipes for AI agents)

### 11.1 "Add a new generation step (track) to the slate"

1. Create `lib/pipeline/<name>.ts` exporting `async function build<Name>(args): Promise<<Type>>`.
2. Add `<Type>` to `lib/pipeline/types.ts` and add the field to `Slate`.
3. Import in `lib/pipeline/slate.ts`, call sequentially, `console.log` a `[slate] N/M …` line for visibility.
4. If the new track produces calendar items, extend `lib/pipeline/planner.ts` so they get scheduled.
5. If it should be visible in the UI, add a section to `app/page.tsx` and a card component under `app/components/`.
6. Regenerate: `npm run slate`. The old `latest.json` will not have the new field — that's fine, defensive `?? []` reads in `app/page.tsx` cover it.

### 11.2 "Swap or extend the LLM"

- Adjust `GEMINI_MODEL_CHAIN` in `.env`. Order matters: best → cheapest fallback.
- Do **not** introduce a different SDK without isolating it behind a `generateJSON`-shaped function — the rest of the pipeline assumes JSON-mode, fallback chain, and truncation recovery.

### 11.3 "Wire the Track A long-form brief into the slate"

- `import { buildLongFormBrief } from "./long-form"` in `slate.ts`.
- Add it as a sequential step (between insight and shorts is reasonable — both depend on `topics` + `brandReport`).
- Add `long_form: LongFormBrief` to `Slate` in `types.ts`.
- Add a section in `app/page.tsx` to render the chapters.

### 11.4 "Debug a 429 from Gemini"

- Check stdout. The wrapper logs `[llm] <model> 429 (attempt n/N), backing off Xms` and `[llm] <model> quota exhausted → trying <next>`.
- If even `gemini-2.5-flash-lite` 429s, the daily quota is gone. Wait for reset or enable Cloud billing on the API key.
- Do not parallelize the slate steps to "make it faster" — that is what triggers 429 in the first place.

### 11.5 "A project has no `is_own` brand"

- The pipeline falls back to the first brand and prints `[slate] No is_own brand in project <pid>, falling back to first brand: <name>`.
- The UI will show that brand as the subject. To fix permanently, set `is_own: true` on the correct brand in the Peec dashboard.

### 11.6 "A project has zero brand_report rows"

- `generateSlate` throws a clear error: *"Project … has no brand report data in the last 30 days. The project may be new — Peec needs at least a week of scrape data."*
- There is no cold-start fallback yet (see "pending features" in [AGENTS.md](./AGENTS.md)).

### 11.7 "Add a new field to a card without regenerating"

- All UI reads from `data/slate/latest.json`. If you only need a presentation-layer change, just edit the React component and re-render.

### 11.8 "Run a one-shot script against the latest slate"

- See [`scripts/tavily-demo.ts`](./scripts/tavily-demo.ts) for the canonical pattern: read `data/slate/latest.json`, type-cast to `Slate`, iterate. Run with `tsx scripts/<name>.ts`.

### 11.9 "Reset everything"

```sh
rm -rf .next data/slate
npm run dev   # re-bundles; the home page will show "No slate yet"
```

---

## 12. Critical invariants — DO NOT VIOLATE

1. **Sequential LLM calls only.** `slate.ts` runs them back-to-back deliberately. Free-tier Gemini RPM is ~5 for preview models. Parallel = 429 = broken demo.
2. **Compute facts in code, not in prompts.** The LLM should *interpret* metrics, not derive ranks from raw numbers. Position is reversed (lower = better) — Flash Lite gets this wrong constantly. See [`insight.ts:computeFacts`](lib/pipeline/insight.ts).
3. **No hardcoded brand list.** `lib/peec/projects.ts` must fetch live every call. Earlier versions had `KNOWN_ALIASES` — removed for a reason.
4. **Every artifact must cite its data source.** Chapter title → fanout sub-query (with `sub_query_source` field). Pitch email → reference the creator's actual cited video. Remix → reference the source URL. Untraceable artifacts kill the demo's credibility.
5. **`.env` keys never go to git.** `.env.example` uses placeholders. The pre-commit hook (`scripts/hooks/pre-commit`) enforces this — never bypass with `--no-verify` unless you know what you're doing.
6. **No `.js` extensions on internal TS imports.** tsx + Next.js use Bundler module resolution; extensionless paths just work. `.js` extensions break Next webpack.

---

## 13. Common pitfalls

| Pitfall | Mitigation |
|---|---|
| Gemini 429 on parallel calls | Pipeline is sequential. Don't change. |
| Gemini 429 on the *fallback* model too | The chain ends at `gemini-2.5-flash-lite` (1000+/day). If even that fails, wait or enable billing. |
| `Cannot read properties of undefined (reading 'call')` in Next | Stale `.next` cache. `rm -rf .next && npm run dev`. |
| `.js` extension imports break Next webpack | All internal TS imports use bare paths; tsx handles via Bundler resolution. |
| Project has `is_own:true` brand missing | Pipeline falls back + warns; UI shows the substitute. |
| Project has zero `brand_report` data | Pipeline throws an explicit error explaining cold-start. |
| Leaked API key in `.env.example` | Placeholders only; pre-commit hook blocks; rotate via Peec / Google AI Studio if leaked. |
| Truncated 6-Shorts JSON on Flash Lite | The wrapper recovers with regex extraction; you may end up with 4–5 shorts instead of 6. |
| Tavily 4xx on enrichment | Caught and warned; the Short keeps its original hook. |
| Long generation timing out behind a slow proxy | `/api/generate` has `maxDuration: 120`. Beyond that, run the CLI (`npm run slate`). |

---

## 14. Glossary

| Term | Meaning |
|---|---|
| **Project** | A Peec workspace tracking one brand, its competitors, topics, prompts, models. Identified by `or_…`. |
| **Brand** | An entity tracked inside a project. The user's brand has `is_own: true`. |
| **Topic** | A category like "wireless earbuds" inside a project. Prompts are tagged with topics. |
| **Prompt** | A query AI engines are tested with, e.g. "best phone under $500". |
| **Chat** | One actual answer an AI engine produced for a prompt on a given date. |
| **Fanout sub-query** | The internal sub-question an AI engine fans out to while answering a prompt. The Track A killer signal. |
| **Visibility (0–1)** | % of relevant prompts where the brand appears. Higher = better. |
| **Share of Voice (0–1)** | The brand's share of total mentions in the category. Higher = better. |
| **Sentiment (0–100)** | How positively the AI describes the brand. Higher = better. |
| **Position (number)** | Average rank within answers. **Lower = better.** Common LLM trip wire. |
| **Wedge** | A (competitor, weak topic) pair where Vairal generates Shorts to attack. |
| **Gap** | A high-trust domain where competitors are cited but the own brand is not. |
| **Slate** | The generated weekly artifact bundle (`data/slate/latest.json`). |

---

## 15. Security & session capture (in this repo)

- **Pre-commit secret scanner** — `scripts/hooks/pre-commit`, plain `sh + grep`, runs in <50ms, blocks Peec / Gemini / Anthropic / Tavily / JWT / GitHub PAT / OpenAI key patterns. Re-install with `npm install` or `sh scripts/install-hooks.sh`.
- **Aikido MCP** — globally registered. Tool name: `mcp__aikido__aikido_full_scan`. Use before opening a PR or after touching auth / public API routes / mailto builders / external fetchers. Last full scan was clean across 12 highest-risk files.
- **Entire** — auto-captures every Claude Code session as a `entire/checkpoints/v1` branch. Commits get an `Entire-Checkpoint` trailer. Useful: `entire status`, `entire rewind --list`, `entire explain --commit <sha>`.

See [AGENTS.md](./AGENTS.md) section *Security & session capture* for invocation examples.

---

## 16. Where to look first (file-by-file priorities)

If you have 5 minutes, read these in order:

1. [`lib/pipeline/types.ts`](./lib/pipeline/types.ts) — every shape in one file.
2. [`lib/pipeline/slate.ts`](./lib/pipeline/slate.ts) — the orchestrator, 80 lines.
3. [`lib/peec/client.ts`](./lib/peec/client.ts) — every Peec endpoint Vairal touches.
4. [`lib/llm/client.ts`](./lib/llm/client.ts) — the fallback chain, why it exists, how truncation recovery works.
5. [`app/page.tsx`](./app/page.tsx) — what the user actually sees.

If you have 30 minutes, read the rest of `lib/pipeline/` and skim `app/components/`.

If you are extending the system, read [AGENTS.md](./AGENTS.md) for the opinionated "DO NOT" list and `docs/peec/` for the full Peec reference.
