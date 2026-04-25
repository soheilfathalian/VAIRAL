# Vairal × Tavily

Real-time web freshness layer. Vairal pulls historical AI-search data from Peec; Tavily fills the gap Peec inherently can't fill — what's happening in the news cycle this week.

## The fit

Vairal generates content from Peec data, which is a 30-day rolling aggregate of how AI engines describe brands. That's perfect for *strategy* (where to invest, which topics to target) but lousy for *timeliness* (the data is days to weeks old by the time you film).

Hot takes only work if they reference something that just happened. Tavily plugs that in.

## Five places Tavily strengthens Vairal

| Use case | Track | Tavily query | What it adds |
|---|---|---|---|
| **Hot-take freshness** | B (Shorts) | `${competitor} criticism review problems controversy`, `topic=news`, `days=14` | Each Short rides this week's news cycle instead of speaking generically. Highest-impact integration. |
| **Pitch personalization** | C (Pitches) | `${creator_name} latest video review`, `topic=general` | Pitch email references the creator's *latest* upload, not their 30-day-old cited video |
| **Wound monitoring** | Headline | `${competitor} negative news`, `topic=news`, `days=3` | Vairal flags when a competitor takes a public hit — react same-day, not next week |
| **Cold-start mode** | All | `${brand} reviews positioning competitors`, `topic=general` | For brands without Peec history, Tavily seeds the analysis from public web data while Peec accumulates |
| **Source verification** | A (Long-form) | `${claim} site:credible-domain.com`, `topic=general` | Before citing a stat in a video brief, Tavily verifies it's still current and finds the freshest source |

## Try the demo

```sh
npm run slate "Project 1 - Nothing Phone"  # ensure latest.json is for a brand with newsworthy competitors
npm run tavily                              # enriches every Short wedge with fresh news
```

Sample output (Nothing Phone slate, April 2026):

```
Short 3/3  ·  vs Pixel  (Consumer Tech Innovation)

  Original hook:  "Does your phone actually look *different*?"
  Tavily query:   "Pixel criticism review problems controversy"

  Fresh news (last 14 days):
    • [4/22/2026] Google Pixel's battery problems are unforgivable after 10 years - Android Authority
    • [4/22/2026] Google seems to be betting big on AI for the Pixel 11 (again), and that's the problem - Android Police
    • [4/18/2026] Google is dropping Samsung modems for the Pixel 11 - Android Police

  💡 How Vairal would remix this Short:
     Replace the hook with a reference to "Google Pixel's battery problems are unforgivable after 10 years"
     The Short now rides a real news cycle instead of speaking generically.
```

## Integration patterns

### Tavily REST (current, in `lib/tavily/client.ts`)

```ts
import { tavilySearch } from "@/lib/tavily/client";

const fresh = await tavilySearch({
  query: "Pixel criticism review problems controversy",
  topic: "news",
  days: 14,
  max_results: 3,
});
```

Auth via `TAVILY_API_KEY` in `.env`. POST to `https://api.tavily.com/search`.

### Tavily MCP (alternative)

Tavily ships an MCP server at:

```
https://mcp.tavily.com/mcp/?tavilyApiKey=<your-key>
```

Useful when you want to expose Tavily search to a Claude Code / Cursor session as a tool. For a backend pipeline like Vairal, REST is simpler and avoids the OAuth/auth-routing dance.

## How to wire Tavily into the slate pipeline (full integration)

The `scripts/tavily-demo.ts` proves the value standalone. To make Tavily part of every slate generation, modify `lib/pipeline/shorts.ts`:

1. After computing wedges (existing logic), for each wedge call `tavilySearch({ query: \`${wedge.competitor.brand.name} criticism review problems controversy\`, topic: "news", days: 14, max_results: 3 })`
2. Pass the top news result to Gemini in the user message: `{ ..., fresh_news_anchor: { title, url, snippet, date } }`
3. Update the system prompt: *"If `fresh_news_anchor` is present in the input, the hook MUST reference that specific news item by its claim or headline."*

Total work: ~30 lines added. Effect: every Vairal-generated Short is timestamped to the current news cycle.

## When NOT to use Tavily

- Long-form briefs where you want the script to age well — Tavily news ties content to a specific moment, which is the opposite of evergreen
- Niche brands whose competitors don't generate news (the demo above showed this with WeWork: WeWork yields rich news, betahaus yields noise) — for these, fall back to Peec-only Shorts
- Markets where AI-search citations move faster than news (rare, but possible for tech category leaders) — Peec data is more current than news for some queries

## Cost / quota

- Tavily free dev keys: ~1000 searches/month
- Each Vairal slate = 3 Tavily searches (one per Short)
- ~330 slates/month on the free tier — plenty for a single brand on a weekly cadence
