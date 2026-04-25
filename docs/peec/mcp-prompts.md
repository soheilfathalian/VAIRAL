# Peec MCP Prompts (Slash Commands)

Peec ships 7 native MCP prompts — opinionated, ready-to-run analysis workflows that show up as slash commands in your AI tool. Each runs a scripted sequence of tool calls and formats the output.

Source: [docs.peec.ai/mcp/prompts](https://docs.peec.ai/mcp/prompts).

## `peec_weekly_pulse`

**Week-over-week digest** covering brand metrics, competitor movers, source shifts, and sentiment flags.

| Argument | Required | Purpose |
|---|---|---|
| `project` | Yes | Project name or ID |

**Output:** Formatted snapshot you can paste into Slack or a Monday team note.

**When to use:** Quick Monday-morning catch-up on what shifted last week.

## `peec_competitor_radar`

Scans every brand × topic × engine combination for **significant visibility shifts** — finds biggest gainers, losers, and exposure zones.

| Argument | Required | Purpose |
|---|---|---|
| `project` | Yes | Project name or ID |
| `threshold_pp` | No, default 10 | Percentage-point change threshold for "significant" |

**Output:** Biggest movers, hypothesized drivers, areas where you're newly exposed.

**When to use:** When you sense a competitor pulled ahead and want to know why.

## `peec_engine_scorecard`

**Per-engine breakdown** of brand visibility, share of voice, sentiment, position — plus source retrieval and citation rates per engine.

| Argument | Required | Purpose |
|---|---|---|
| `project` | Yes | Project name or ID |

**Output:** Engine-by-engine performance report highlighting untapped engines.

**When to use:** Deciding which engine to prioritize next (e.g., you dominate ChatGPT but Perplexity is invisible).

## `peec_topic_heatmap`

A **visibility heatmap** across all your topics × all tracked engines, calibrated to baseline performance.

| Argument | Required | Purpose |
|---|---|---|
| `project` | Yes | Project name or ID |

**Output:** Grid labeled with blind spots (red), weak (orange), moderate (yellow), strong (green), dominant (blue) cells.

**When to use:** Strategic planning — finding the topic × engine cells where investment moves the needle most.

## `peec_prompt_grader`

Grades your tracked prompt set on **topic balance**, **tag hygiene**, **funnel coverage**, **branded ratio**, **duplicate detection**, and **model data gaps**.

| Argument | Required | Purpose |
|---|---|---|
| `project` | Yes | Project name or ID |

**Output:** A–F report card with the top 3 recommended fixes.

**When to use:** Quarterly audit of your prompt setup — making sure you're tracking the right questions.

## `peec_source_authority`

Audits domain performance as AI sources — retrieval and citation rates, top URLs per domain, content formats, authority gaps vs competitors.

| Argument | Required | Purpose |
|---|---|---|
| `project` | Yes | Project name or ID |

**Output:** Authority breakdown identifying citation opportunities vs competitors. Which channels to invest in (your own blog, guest posts, UGC, references).

**When to use:** Content team planning — understanding where to spend writing/PR cycles.

## `peec_campaign_tracker`

**Before/after comparison** around a launch date — tracks brand metrics and source pickup by engine for a specific campaign or release.

| Argument | Required | Purpose |
|---|---|---|
| `project` | Yes | Project name or ID |
| `campaign_date` | Yes | YYYY-MM-DD format |
| `urls` | No | Comma-separated list of URLs to monitor for pickup |

**Output:** Engine-by-engine campaign impact analysis. Did the campaign move visibility? Which engines picked it up?

**When to use:** Measuring PR launches, guest posts, content refreshes, product launches.

## How Vairal relates to these

Vairal's slate generation is a *new* workflow that doesn't ship in Peec by default — it composes data from `get_brand_report`, `list_search_queries`, `get_url_report`, and `list_topics` to produce production-ready video assets rather than analytics summaries.

Where Peec's slash commands answer **"what's happening?"**, Vairal answers **"what should we film this week?"**.
