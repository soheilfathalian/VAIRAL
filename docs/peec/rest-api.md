# Peec AI REST API

The HTTP endpoints behind every MCP tool. Vairal's pipeline uses these directly because they accept API-key auth (the MCP requires OAuth, which doesn't fit a backend pipeline).

OpenAPI spec: `https://api.peec.ai/customer/v1/openapi/json`

## Auth

```http
x-api-key: skc-xxxxxxxx
```

API keys come from the Peec dashboard. They're project-scoped where possible — prefer project-scoped keys over account-wide ones.

> The MCP server at `api.peec.ai/mcp` does **not** accept API keys. It's OAuth-only. The REST API at `api.peec.ai/customer/v1` does **not** accept OAuth tokens. Different surfaces, different auth.

## Conventions

- **Base URL:** `https://api.peec.ai/customer/v1`
- **Project ID** always passed as `?project_id=or_xxxxxxxx` query parameter
- **List endpoints** are GET with query parameters
- **Report and query endpoints** are POST with a JSON body
- **Pagination** via `limit` (default ~10) and `offset`

## Endpoint reference

### Projects

| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List projects accessible to your API key |

### Brands, topics, tags, prompts (CRUD)

| Method | Path | Description |
|---|---|---|
| GET | `/brands?project_id=` | List brands |
| POST | `/brands?project_id=` | Create brand |
| PATCH | `/brands/{brand_id}?project_id=` | Update brand |
| DELETE | `/brands/{brand_id}?project_id=` | Soft-delete brand |
| GET | `/brands/suggestions?project_id=` | Open brand suggestions |
| POST | `/brands/suggestions/{id}/accept` | Accept suggestion |
| POST | `/brands/suggestions/{id}/reject` | Reject suggestion |
| GET | `/topics?project_id=` | List topics |
| POST | `/topics?project_id=` | Create topic |
| PATCH | `/topics/{topic_id}?project_id=` | Update topic |
| DELETE | `/topics/{topic_id}?project_id=` | Soft-delete topic |
| GET | `/topics/suggestions?project_id=` | Open topic suggestions |
| POST | `/topics/suggestions/{id}/accept` | Accept |
| POST | `/topics/suggestions/{id}/reject` | Reject |
| GET | `/tags?project_id=` | List tags |
| POST | `/tags?project_id=` | Create tag |
| PATCH | `/tags/{tag_id}?project_id=` | Update tag |
| DELETE | `/tags/{tag_id}?project_id=` | Soft-delete tag |
| GET | `/prompts?project_id=` | List prompts |
| POST | `/prompts?project_id=` | Create prompt (may consume credits) |
| PATCH | `/prompts/{prompt_id}?project_id=` | Update prompt |
| DELETE | `/prompts/{prompt_id}?project_id=` | Soft-delete prompt (cascades to chats) |
| GET | `/prompts/suggestions?project_id=` | Open prompt suggestions |
| POST | `/prompts/suggestions/{id}/accept` | Accept |
| POST | `/prompts/suggestions/{id}/reject` | Reject |

### Models / Model channels

| Method | Path | Description |
|---|---|---|
| GET | `/models?project_id=` | List models (deprecated, use `/model-channels`) |
| GET | `/model-channels?project_id=` | List model channels (preferred — stable across model upgrades) |

### Chats

| Method | Path | Description |
|---|---|---|
| GET | `/chats?project_id=&start_date=&end_date=` | List chats in a date range |
| GET | `/chats/{chat_id}/content?project_id=` | Get full chat (sources, messages, brands_mentioned) |

### Reports (POST with JSON body)

All report endpoints accept this body shape:

```json
{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "limit": 50,
  "offset": 0,
  "dimensions": ["model_id"],
  "filters": { "topic_ids": ["to_xxxxx"] }
}
```

| Method | Path | Returns |
|---|---|---|
| POST | `/reports/brands?project_id=` | Brand visibility/sentiment/position rows |
| POST | `/reports/domains?project_id=` | Domain citation/retrieval rows |
| POST | `/reports/urls?project_id=` | URL-level rows with `title`, `channel_title`, classification |

### Queries (POST with JSON body)

Same body shape as reports.

| Method | Path | Returns |
|---|---|---|
| POST | `/queries/search?project_id=` | Fanout search sub-queries |
| POST | `/queries/shopping?project_id=` | Fanout shopping/product sub-queries |

### Sources

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/sources/urls/content?project_id=` | `{ "url": "...", "max_length": 4000 }` | Scraped markdown content |

## What's not in REST

The MCP `get_actions` tool has **no REST equivalent** as of the hackathon (April 2026). If you need opportunity scoring from a backend, you'll have to compute it yourself from `/reports/urls` + `/reports/domains` data, or wait for the API to add it.

## Example

Pulling the brand report for the Nothing Phone project, last 30 days:

```sh
curl -X POST 'https://api.peec.ai/customer/v1/reports/brands?project_id=or_faaa7625-bc84-4f64-a754-a412d423c641' \
  -H 'x-api-key: skc-xxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "start_date": "2026-03-26",
    "end_date":   "2026-04-25",
    "limit": 20
  }'
```

Response:

```json
{
  "data": [
    {
      "brand": { "id": "kw_...", "name": "Apple" },
      "share_of_voice": 0.232,
      "visibility":     0.503,
      "sentiment":      66,
      "position":       3.56,
      "mention_count":  1302
    },
    ...
  ]
}
```

## Vairal's typed wrapper

For TypeScript projects, see [`lib/peec/client.ts`](../../lib/peec/client.ts) and [`lib/peec/types.ts`](../../lib/peec/types.ts) for a typed wrapper that handles auth, query params, and response envelopes.

## Rate limits

Peec's docs page on rate limits: [docs.peec.ai/api/ratelimits](https://docs.peec.ai/api/ratelimits). For the hackathon test projects we hit no limits running ~30 requests in parallel during development.
