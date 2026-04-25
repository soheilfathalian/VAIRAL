import { peec } from "../peec/client.js";
import { generateJSON } from "../llm/client.js";
import type { ShortScript } from "./types.js";
import type { BrandReportRow, Topic } from "../peec/types.js";

type Args = {
  projectId: string;
  ownBrandName: string;
  topics: Topic[];
  brandReport: BrandReportRow[];
  range: { start_date: string; end_date: string };
};

export async function buildShorts(args: Args): Promise<ShortScript[]> {
  const { projectId, ownBrandName, topics, brandReport, range } = args;

  const competitors = brandReport
    .filter((b) => b.brand.name !== ownBrandName && b.visibility > 0.1)
    .sort((a, b) => a.sentiment - b.sentiment)
    .slice(0, 3);

  const wedges = await Promise.all(
    competitors.map(async (c) => {
      const topicScores = await Promise.all(
        topics.map(async (t) => {
          const rpt = await peec.brandReport(projectId, {
            ...range,
            limit: 20,
            filters: { topic_ids: [t.id] },
          }).catch(() => [] as BrandReportRow[]);
          const compRow = rpt.find((r) => r.brand.id === c.brand.id);
          return { topic: t, sentiment: compRow?.sentiment ?? 100, visibility: compRow?.visibility ?? 0 };
        })
      );
      const weakest = topicScores
        .filter((s) => s.visibility > 0.05)
        .sort((a, b) => a.sentiment - b.sentiment)[0] ?? { topic: topics[0], sentiment: c.sentiment };
      return { competitor: c, weakTopic: weakest.topic.name, weakSentiment: weakest.sentiment };
    })
  );

  return generateJSON<ShortScript[]>({
    system: shortsSystem(ownBrandName),
    user: JSON.stringify({
      brand: ownBrandName,
      wedges: wedges.map((w) => ({
        competitor: w.competitor.brand.name,
        competitor_visibility: w.competitor.visibility,
        competitor_sentiment: w.competitor.sentiment,
        weakest_topic_for_competitor: w.weakTopic,
        sentiment_in_that_topic: w.weakSentiment,
      })),
    }, null, 2),
  });
}

function shortsSystem(brand: string): string {
  return `You are a short-form video writer for ${brand}, an underdog consumer brand. Generate exactly 3 short-form video scripts (TikTok / Reels / Shorts), each 30-45 seconds.

Each script targets a different "wedge" — a topic where a major competitor has weak sentiment in AI search results, where ${brand} can present a contrarian, honest, fan-perspective take.

Tone: enthusiast / observer voice, not corporate. The person delivering this is a real fan or community member, not a marketer. They speak with conviction and specifics.

Output must be a JSON array of exactly 3 objects, each matching:
{
  "topic": "string — the topic this short addresses",
  "competitor_wedge": { "name": "competitor brand", "sentiment": number, "weak_topic": "the topic" },
  "hook": "string — 0-3s opening line. MUST grab attention. NEVER 'Hey guys' or 'In this video'.",
  "claim": "string — 3-20s the central claim or argument, specific to the wedge",
  "payoff": "string — 20-35s the resolution, what to do, what to feel, what to share",
  "on_screen_text": ["3-5 short text overlays that appear at key moments"],
  "hashtags": ["6-10 hashtags, mix of broad + niche"],
  "shot_list": ["3-5 specific shots, phone-only, achievable in one filming session"]
}

Output ONLY the JSON array, no preamble, no code fences.`;
}
