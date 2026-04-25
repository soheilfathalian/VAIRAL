import { peec } from "../peec/client";
import { generateJSON } from "../llm/client";
import type { BrandReportRow, Topic } from "../peec/types";
import type { ShortScript } from "./types";

type Args = {
  projectId: string;
  ownBrandName: string;
  topics: Topic[];
  range: { start_date: string; end_date: string };
};

export async function buildLowSentimentShorts(args: Args): Promise<ShortScript[]> {
  const { projectId, ownBrandName, topics, range } = args;

  if (topics.length === 0) return [];

  const topicScores = await Promise.all(
    topics.map(async (t) => {
      const rpt = await peec.brandReport(projectId, {
        ...range,
        limit: 20,
        filters: { topic_ids: [t.id] },
      }).catch(() => [] as BrandReportRow[]);
      const ourRow = rpt.find((r) => r.brand.name === ownBrandName);
      return { topic: t.name, sentiment: ourRow?.sentiment ?? 100 };
    })
  );

  // Take up to 4 worst topics
  const weakestTopics = topicScores
    .sort((a, b) => a.sentiment - b.sentiment)
    .slice(0, 4);

  return generateJSON<ShortScript[]>({
    system: lowSentimentSystem(ownBrandName),
    user: JSON.stringify({
      brand: ownBrandName,
      weak_topics: weakestTopics,
    }, null, 2)
  });
}

function lowSentimentSystem(brand: string): string {
  return `You are a short-form video writer for ${brand}, an underdog consumer brand.
I will give you a list of "weak topics" where ${brand} currently has poor sentiment in AI search results.

Your goal is to write a short-form video script (TikTok / Reels / Shorts), 30-45 seconds each, for EACH weak topic. These videos should directly combat the negative sentiment by offering a contrarian, transparent, or fan-perspective take that turns the weakness into a strength or explains how it's being fixed.

Tone: enthusiast / observer voice, transparent, assertive.

Output must be a JSON array with exactly as many objects as topics provided (one for each topic), each matching:
{
  "topic": "string — the specific weak topic being addressed",
  "competitor_wedge": { "name": "${brand}", "sentiment": 0, "weak_topic": "the topic" },
  "hook": "string — 0-3s opening line. MUST grab attention.",
  "claim": "string — 3-20s the central claim or argument combating the low sentiment",
  "payoff": "string — 20-35s the resolution, what to do, what to feel",
  "on_screen_text": ["3-5 short text overlays that appear at key moments"],
  "hashtags": ["6-10 hashtags, mix of broad + niche"],
  "shot_list": ["3-5 specific shots, phone-only, achievable in one filming session"]
}

Output ONLY the JSON array, no preamble, no code fences.`;
}
