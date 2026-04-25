# Peec MCP Tools

All 27 tools the Peec MCP server exposes. Source: [docs.peec.ai/mcp/tools](https://docs.peec.ai/mcp/tools).

Convention: parameters in **bold** are required.

## Read tools (15)

### `list_projects`
Lists projects accessible to your Peec account.

| Parameters | Returns |
|---|---|
| _(none)_ | Rows of `id`, `name`, `status` |

### `list_brands`
Lists brands (your brand and tracked competitors) in a project.

| Parameters | Returns |
|---|---|
| **`project_id`** (string), `limit` (number), `offset` (number) | Rows of `id`, `name`, `domains`, `aliases`, `is_own` |

### `list_topics`
Lists topic groupings under which prompts are organized.

| Parameters | Returns |
|---|---|
| **`project_id`**, `limit`, `offset` | Rows of `id`, `name` |

### `list_tags`
Lists cross-cutting tag labels in a project.

| Parameters | Returns |
|---|---|
| **`project_id`**, `limit`, `offset` | Rows of `id`, `name` |

### `list_models`
Lists all AI engines (models) configured for a project.

| Parameters | Returns |
|---|---|
| **`project_id`** | Rows of `id`, `name`, `is_active` |

### `list_prompts`
Lists prompts with optional topic or tag filtering.

| Parameters | Returns |
|---|---|
| **`project_id`**, `topic_id`, `tag_id`, `limit`, `offset` | Rows of `id`, `text`, `tag_ids`, `topic_id`, `volume` |

### `list_chats`
Lists individual AI responses (chats) for a project over a date range.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`start_date`**, **`end_date`**, `brand_id`, `prompt_id`, `model_id`, `limit`, `offset` | Rows of `id`, `prompt_id`, `model_id`, `date` |

### `get_chat`
Returns the full content of a single chat.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`chat_id`** | Object with `messages`, `brands_mentioned`, `sources`, `queries`, `products`, `prompt`, `model` |

### `list_search_queries`
Lists the **fanout sub-queries** an AI engine ran internally while answering prompts. Vairal uses this for chapter title targeting — it's the gold endpoint.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`start_date`**, **`end_date`**, `prompt_id`, `chat_id`, `model_id`, `model_channel_id`, `topic_id`, `tag_id`, `limit`, `offset` | Rows of `prompt_id`, `chat_id`, `model_id`, `date`, `query_index`, `query_text` |

### `list_shopping_queries`
Lists product/shopping sub-queries issued during AI responses (relevant for retail and e-commerce intent).

| Parameters | Returns |
|---|---|
| Same shape as `list_search_queries` | Rows including `query_text`, `products` |

### `get_brand_report`
Returns brand visibility, sentiment, position, and share of voice across AI search engines.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`start_date`**, **`end_date`**, `dimensions`, `filters`, `limit`, `offset` | Rows of `brand_id`, `brand_name`, `visibility`, `mention_count`, `share_of_voice`, `sentiment`, `position` |

### `get_domain_report`
Returns source-domain retrieval and citation metrics.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`start_date`**, **`end_date`**, `dimensions`, `filters`, `limit`, `offset` | Rows of `domain`, `classification`, `retrieved_percentage`, `retrieval_rate`, `citation_rate`, `mentioned_brand_ids` |

### `get_url_report`
Returns URL-level retrieval and citation metrics. Includes `channel_title` for YouTube URLs — the foundation of Vairal's channel pitch list.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`start_date`**, **`end_date`**, `dimensions`, `filters`, `limit`, `offset` | Rows of `url`, `classification`, `title`, `channel_title`, `citation_count`, `retrievals`, `citation_rate`, `mentioned_brand_ids` |

### `get_url_content`
Returns the scraped markdown content of a source URL Peec has indexed.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`url`**, `max_length` | Object with `url`, `title`, `domain`, `channel_title`, `classification`, `content`, `content_length`, `truncated`, `content_updated_at` |

### `get_actions`
Returns Peec's opportunity-scored action recommendations for a project. Grouped by `owned pages`, `editorial coverage`, `reference sites`, and `UGC communities`.

| Parameters | Returns |
|---|---|
| **`project_id`**, **`start_date`**, **`end_date`**, **`scope`**, `tag_ids`, `topic_ids`, `model_ids`, `country_codes`, `url_classification`, `domain` | For `scope=overview`: `action_group_type`, `url_classification`, `domain`, `opportunity_score`, support metrics. For other scopes: `text`, `group_type`, scores |

## Write tools (12)

All writes require organization-owner access. Destructive ops are flagged `destructiveHint: true` and prompt for confirmation.

### Brand
| Tool | What it does |
|---|---|
| `create_brand` | Create a new tracked brand (own brand or competitor). Params: **`project_id`**, **`name`**, `domains`, `aliases`, `regex` |
| `update_brand` | Update name, regex, aliases, or domains. Params: **`project_id`**, **`brand_id`**, optional fields |
| `delete_brand` | Soft-delete a brand. ⚠ destructive |

### Prompt
| Tool | What it does |
|---|---|
| `create_prompt` | Create a new tracked prompt. May consume plan credits. Params: **`project_id`**, **`text`**, **`country_code`**, `topic_id`, `tag_ids` |
| `update_prompt` | Update topic and/or tags. Params: **`project_id`**, **`prompt_id`**, optional fields |
| `delete_prompt` | Soft-delete a prompt and cascade to its chats. ⚠ destructive |

### Tag
| Tool | What it does |
|---|---|
| `create_tag` | Create a new tag. Params: **`project_id`**, **`name`**, `color` |
| `update_tag` | Rename or recolor a tag. Params: **`project_id`**, **`tag_id`**, optional fields |
| `delete_tag` | Soft-delete a tag and detach from all prompts. ⚠ destructive |

### Topic
| Tool | What it does |
|---|---|
| `create_topic` | Create a new topic. Params: **`project_id`**, **`name`**, `country_code` |
| `update_topic` | Rename a topic. Params: **`project_id`**, **`topic_id`**, **`name`** |
| `delete_topic` | Soft-delete a topic, detach prompts. ⚠ destructive |

## Tools Vairal uses

For reference — these are the tools wired into Vairal's pipeline (via the equivalent REST endpoints):

| Vairal track | Peec tools used |
|---|---|
| Headline insight | `list_brands`, `get_brand_report` |
| Track A — long-form | `list_topics`, `list_prompts`, `list_search_queries`, `get_url_report` |
| Track B — Shorts | `get_brand_report` (with topic filter), sentiment-driven |
| Track C — pitches | `get_url_report` (filtered to YouTube channels) |
| Replay validation (planned) | `list_chats`, `get_chat`, `get_url_content` |
