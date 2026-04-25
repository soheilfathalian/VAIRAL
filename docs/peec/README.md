# Peec AI Reference

A complete reference for the Peec AI tools and APIs that Vairal builds on. Compiled from [docs.peec.ai](https://docs.peec.ai) and verified against the live API during the Big Berlin Hack.

## What Peec AI does

Peec AI is the analytics layer for AI search. It tracks how brands appear in conversations across ChatGPT, Perplexity, Gemini, Google AI Overviews, Google AI Mode, Claude, Microsoft Copilot, and Grok — measuring **visibility**, **share of voice**, **sentiment**, and **position** the same way traditional SEO tools track keyword rankings.

Crucially, it also exposes the *source* layer: which URLs and domains AI engines retrieved and cited when forming each answer. That's where distribution actually happens.

## In this folder

| Doc | Use |
|---|---|
| [Concepts](./concepts.md) | The data model: projects, brands, topics, prompts, chats, sources, models, model channels |
| [Metrics](./metrics.md) | What visibility, share of voice, sentiment, and position actually mean |
| [MCP Setup](./mcp-setup.md) | Connect the Peec MCP server to Claude Code, Cursor, Windsurf, VS Code |
| [MCP Tools](./mcp-tools.md) | All 27 tools (15 read + 12 write) with parameters and return shapes |
| [MCP Prompts](./mcp-prompts.md) | The 7 native slash-command workflows (weekly pulse, competitor radar, etc.) |
| [REST API](./rest-api.md) | The HTTP endpoints with auth, paths, request/response shapes |
| [Use Cases](./use-cases.md) | Workflow patterns for the most common questions |

## Two ways to access Peec data

**MCP (OAuth)** — best for interactive work in AI tools. One-click auth, no key management, slash commands give you opinionated workflows.

**REST API (x-api-key)** — best for automation, backends, and CI. Same data, plus you control the call patterns. This is what Vairal uses internally.

The two surfaces are equivalent in coverage of read tools. For writes, the MCP exposes the same CRUD operations the REST API does, but with confirmation prompts.

## The piece nobody talks about

**Fanout queries.** When a user asks an AI engine a question, the engine often runs 2–5 internal sub-queries to gather information. Peec captures those (`/queries/search` or the `list_search_queries` MCP tool). They're the most concrete representation of what AI engines are actually looking for, and they make excellent targeting material for content (chapter titles, headings, FAQ entries).

If you only learn one Peec endpoint, learn that one.
