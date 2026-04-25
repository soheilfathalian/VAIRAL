# Peec AI Workflow Patterns

Real questions you can answer by composing Peec's tools. Use these as starting points; they're the patterns Vairal's slate generation builds on.

## Brand & visibility

### "How visible are we across AI engines this month?"
1. `get_brand_report` for the date window
2. Sort by `visibility`; locate your `is_own:true` row
3. Compare to top competitor

### "Where are we losing — what topics?"
1. `list_topics` to enumerate
2. For each topic, `get_brand_report` with `filters.topic_ids=[topic_id]`
3. Compute `gap = max(competitor_visibility) − own_visibility` per topic
4. Rank topics by gap

### "Which engine should we focus on next?"
1. `get_brand_report` with `dimensions: ["model_id"]`
2. Find engines where competitor visibility is high but yours is low — that's untapped pickup

### "Are we trending up or down vs last month?"
1. `get_brand_report` for current 30d
2. `get_brand_report` for previous 30d
3. Diff visibility/SoV/sentiment per brand
4. Sort by movement to find the story

## Source & citation

### "Which URLs cite us most?"
1. `get_url_report` for the date range
2. Filter `mentioned_brand_ids` includes your `is_own` brand id
3. Sort by `citation_count`

### "Which domains feed AI engines in our category?"
1. `get_domain_report`
2. Sort by `retrieval_count` (or `citation_count` for higher precision)
3. Filter by `classification` to focus on UGC vs editorial vs reference

### "Which YouTube channels matter?"
1. `get_url_report` with `limit: 200`
2. Filter `url.includes("youtube.com")` and `channel_title != null`
3. Group by `channel_title`, sum `retrievals` and `citation_count`
4. Rank — these are your guest-podcast / collab targets (this is what Vairal does for Track C)

### "What's in the cited content?"
1. Pick a URL from `get_url_report`
2. `get_url_content` returns the scraped markdown
3. Use it to understand the language patterns that win citations

## Targeting & content

### "What sub-queries does ChatGPT actually run?"
1. Pick a prompt: `list_prompts`
2. `list_search_queries` with `prompt_id` and date range
3. The `query_text` rows are the sub-queries — use them as headings, FAQ entries, or chapter titles

### "Where's the messaging vacuum we can plant a flag?"
1. `get_brand_report` per topic
2. Find topics where total brand share is low (no clear winner)
3. Build a comprehensive resource targeting that topic's prompts

### "Are AI engines saying anything wrong about us?"
1. `list_chats` filtered to your brand mentions
2. `get_chat` on each → read the actual response text
3. Cross-reference factual claims against current truth
4. For wrong claims, check `sources` to find the misinformed URL → outreach to correct

## Competitive

### "Why did competitor X jump in visibility?"
1. `get_brand_report` for two windows (before and after the jump)
2. `get_url_report` filtered to URLs mentioning competitor X
3. Compare the URL set — new URLs in the recent window are likely the cause
4. `get_url_content` to read the new sources

### "Who's taking share of voice from us?"
1. `get_brand_report` over time
2. Compute SoV deltas per competitor
3. The biggest gainer is who's actively grabbing your conversation

### "What does AI say negatively about competitors?"
1. `get_brand_report` per topic, find competitors with lowest sentiment in each topic
2. `list_chats` filtered to those competitor + topic combinations
3. `get_chat` to read the negative framing — that's your wedge to address in your own positioning

## Project management

### "Add a new prompt to track"
1. `create_prompt` with text, country_code, optional topic and tags
2. Wait for the next scrape cycle for data to populate

### "Track a new competitor"
1. `create_brand` with name, domains, aliases, optional regex
2. Brand metrics start populating from next scrape

### "Reorganize prompts under topics"
1. `list_prompts`
2. `create_topic` if needed
3. `update_prompt` to set `topic_id`

### "Clean up unused tags"
1. `list_tags`
2. `list_prompts` with each `tag_id` to see usage
3. `delete_tag` for any with zero usage (confirms before destruction)

## Strategic planning

### "What should we focus on next quarter?"
1. `get_actions` (MCP only, scope `overview`) → ranked opportunities grouped by owned pages, editorial, reference, UGC
2. Drill down with `get_actions` on the highest-scoring group for concrete actions

### "Measure a launch's AI pickup"
1. Use the `peec_campaign_tracker` MCP slash command, OR:
2. `get_brand_report` for a tight window after launch_date
3. `get_url_report` filtered to your launch URLs to confirm pickup

## Where Vairal fits

Vairal composes a specific subset of these patterns:

- *"What topics are we losing?"* → drives Track A topic selection
- *"What sub-queries does ChatGPT run?"* → becomes Track A chapter titles
- *"Which YouTube channels matter?"* → becomes Track C pitches
- *"What does AI say negatively about competitors?"* → becomes Track B Shorts wedges

The combination produces a weekly content slate that's grounded in real AI search data instead of generic content marketing intuition.
