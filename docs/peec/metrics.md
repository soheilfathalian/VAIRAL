# Peec AI Metrics

Four headline metrics define how a brand performs in AI search. Vairal's headline-insight engine reads them in combination to find the underdog story.

## Visibility

**The percentage of relevant prompts where your brand appears in the AI's answer.** This is the fundamental "did we get into the conversation" metric.

```
visibility = mentioned_in_chats / total_relevant_chats
```

Read it like reach. If visibility is 50%, the engine includes you in half the answers when users ask category-relevant questions.

## Share of Voice (SoV)

**Your share of all brand mentions across the category.** Different from visibility because it weighs how much screen-time each brand gets *within* the answer, not just whether it's mentioned at all.

```
share_of_voice = your_mention_count / sum(all_brand_mention_counts)
```

A brand can have lower visibility than competitors but higher SoV if it gets long, detailed mentions when it does appear.

## Sentiment

**A 0–100 score for whether the AI describes your brand positively (100), neutrally, or negatively (0).** Aggregated across mentions in the time window.

Most brands cluster between 60 and 75. Anything under 55 is a flag worth investigating — it usually traces back to a specific prompt or topic where the AI is repeating a critical narrative.

## Position

**The average rank of your brand within answers that mention it.** Lower is better — position 1 means you're listed first when AI engines list multiple brands.

This is the metric most people miss. A brand can have low visibility but excellent position, which means: *when it shows up, it's at the top of the list*. That's the underdog's secret signal — it tells you the brand wins on quality of mention, and just needs to win on frequency.

## Reading them in combination

Vairal's `headlineInsight` function looks at all four together:

| Signal | What it means |
|---|---|
| High visibility, high position rank | Dominant — Apple in the smartphone space |
| High visibility, low position rank | Mentioned a lot but always last → losing on reputation |
| Low visibility, top position | **Underdog wedge — wins when it shows up, just doesn't show up enough** |
| Low visibility, low position | Effectively invisible, needs both content and reputation work |
| Low sentiment, any visibility | A specific narrative is dragging the brand — find the source |

Nothing Phone's actual numbers show the third pattern: position 2.39 (best in class), visibility 19.9% (5th of 10 brands). That's the exact moment to invest in distribution, not in changing what's being said.

## Dimensions and filters

Most reports support `dimensions` (group by) and `filters` (narrow to). Common combinations:

- Group by `model_id` to see per-engine performance differences
- Filter by `topic_ids` to find topic-level blind spots
- Filter by `country_codes` to check regional variation
- Group by `prompt_id` to find your worst-performing individual prompts
