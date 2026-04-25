# Peec AI Concepts

The data model behind every metric, tool, and report.

## Project

The top-level container. A project corresponds to a brand you're tracking and the competitive context around it. Vairal uses two test projects from the hackathon:

- `or_faaa7625-bc84-4f64-a754-a412d423c641` — Project 1 - Nothing Phone
- `or_47ccb54e-0f32-4c95-b460-6a070499d084` — Project 2 - Attio

Project IDs are passed as `project_id` query parameters on every REST call.

## Brand

A tracked entity within a project — your own brand or a competitor. Brands have:

- **Name** (e.g. "Nothing Phone")
- **Domains** that count as the brand's owned web presence
- **Aliases** for matching variant names
- **`is_own: true`** flag — the project's own brand. Vairal auto-detects this to know who the underdog is.

## Topic

A grouping of related prompts representing a market territory. Nothing has 5 topics: Consumer Tech Innovation, Wireless Audio, Mobile Ecosystem, Smartphone Design, Minimalist Hardware.

## Tag

A cross-cutting label attached to prompts. Different from topics — tags can apply across topics (e.g. "purchase-intent", "comparison").

## Prompt

A natural-language question representative of how real users talk to AI engines. Examples from Nothing's tracked set:

- "Why is Nothing considered a disruptor in the electronics industry?"
- "Compare Android skins for the most minimalist feel"
- "What are the most aesthetic phones with unique transparent hardware?"

Prompts have `volume` (Peec's estimate of how often this kind of question is being asked).

## Chat

A single AI engine response to a prompt, captured by Peec's scrapers. Each chat has:

- The user prompt
- The assistant response (full markdown)
- The brands mentioned (with position in the response)
- The source URLs the engine retrieved/cited
- The fanout sub-queries the engine ran internally

A single prompt usually generates many chats (one per engine per scrape).

## Source

A URL that an AI engine retrieved or cited when generating an answer. Sources are the foundation of every visibility metric — Peec measures both *retrieval* (engine looked at the URL) and *citation* (engine actually used it in the answer).

Sources have a **classification** (`ARTICLE`, `LISTICLE`, `COMPARISON`, `UGC`, `EDITORIAL`, `REFERENCE`, `CORPORATE`, `PROFILE`, `OTHER`) which signals the content type and which channels matter for which prompts.

## Model

An AI engine being tracked. From the Nothing project's active set: ChatGPT, Gemini, Google AI Overview. The full list across plans includes Perplexity, Claude, Copilot, Grok, AI Mode, and several open-weights models.

## Model Channel

The *stable* identifier for an AI surface as the underlying model evolves. Use this instead of `model_id` if you want your code to keep working across model upgrades.

## Fanout query

The sub-query an AI engine runs internally while answering a user prompt. For "Compare Android skins for the most minimalist feel," ChatGPT might fan out to:

- `Android skins with most minimalist feel compare OxygenOS Pixel experience One UI`
- `best Android custom interfaces minimalist feel Android skins comparison`

These are the most direct evidence of what the engine is actually looking for. Vairal uses them as YouTube chapter titles, so the produced content directly answers what AI is searching for.

## Action

Peec's opportunity-scored recommendations grouped by content type — owned pages, editorial coverage, reference sites, UGC communities. Available via the MCP `get_actions` tool but not (yet) through the REST API.
