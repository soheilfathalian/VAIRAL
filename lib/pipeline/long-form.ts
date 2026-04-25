import { peec } from "../peec/client.js";
import { generateJSON } from "../llm/client.js";
import type { LongFormBrief } from "./types.js";
import type { BrandReportRow, Prompt, Topic, UrlReportRow, FanoutQuery } from "../peec/types.js";

type Args = {
  projectId: string;
  ownBrandName: string;
  topics: Topic[];
  brandReport: BrandReportRow[];
  range: { start_date: string; end_date: string };
};

export async function buildLongFormBrief(args: Args): Promise<LongFormBrief> {
  const { projectId, ownBrandName, topics, range } = args;

  const blindSpot = await pickBlindSpotTopic(projectId, topics, ownBrandName, range);
  const prompts = await peec.listPrompts(projectId, { topic_id: blindSpot.id, limit: 50 });
  const topPrompts = [...prompts].sort((a, b) => b.volume - a.volume).slice(0, 5);

  const fanoutSets = await Promise.all(
    topPrompts.map((p) =>
      peec.fanoutSearch(projectId, { ...range, prompt_id: p.id, limit: 5 }).catch(() => [] as FanoutQuery[])
    )
  );
  const subQueries = uniq(fanoutSets.flat().map((f) => f.query.text)).slice(0, 8);

  const urls = await peec.urlReport(projectId, { ...range, limit: 100 });
  const ytChannels = urls
    .filter((u) => u.url.includes("youtube.com") && u.channel_title)
    .sort((a, b) => b.retrievals - a.retrievals)
    .slice(0, 5);

  const articleAuthorities = urls
    .filter((u) => !u.url.includes("youtube.com") && u.classification !== "OTHER")
    .sort((a, b) => b.citation_rate - a.citation_rate)
    .slice(0, 5);

  return generateJSON<LongFormBrief>({
    system: longFormSystem(ownBrandName),
    user: JSON.stringify({
      brand: ownBrandName,
      topic: blindSpot,
      target_prompts: topPrompts.map((p) => ({ id: p.id, text: p.messages[0]?.content })),
      ai_engine_sub_queries: subQueries,
      cited_youtube_videos: ytChannels.map((u) => ({ url: u.url, channel: u.channel_title, title: u.title })),
      cited_articles: articleAuthorities.map((u) => ({ url: u.url, title: u.title, citation_rate: u.citation_rate })),
    }, null, 2),
  }).then((brief) => ({
    ...brief,
    topic: blindSpot.name,
    topic_id: blindSpot.id,
    target_prompts: topPrompts.map((p) => ({ id: p.id, text: p.messages[0]?.content ?? "" })),
    citation_targets: ytChannels.map((u) => ({
      url: u.url,
      channel_title: u.channel_title,
      why: `${u.retrievals} retrievals, ${u.citation_count} citations in last 30d`,
    })),
  }));
}

async function pickBlindSpotTopic(
  projectId: string,
  topics: Topic[],
  ownBrandName: string,
  range: { start_date: string; end_date: string }
): Promise<Topic> {
  const scores = await Promise.all(
    topics.map(async (t) => {
      const rpt = await peec.brandReport(projectId, {
        ...range,
        limit: 20,
        filters: { topic_ids: [t.id] },
      }).catch(() => [] as BrandReportRow[]);
      const own = rpt.find((r) => r.brand.name === ownBrandName);
      const competitors = rpt.filter((r) => r.brand.name !== ownBrandName);
      const compMax = competitors.reduce((m, r) => Math.max(m, r.visibility), 0);
      const ownViz = own?.visibility ?? 0;
      const gap = compMax - ownViz;
      return { topic: t, gap, ownViz };
    })
  );
  scores.sort((a, b) => b.gap - a.gap);
  return scores[0]?.topic ?? topics[0];
}

const uniq = <T>(arr: T[]) => Array.from(new Set(arr));

function longFormSystem(brand: string): string {
  return `You are a senior YouTube strategist and channel producer for ${brand}, an underdog consumer brand competing against giants. You generate one production-ready long-form video brief.

Your output must be valid JSON matching this exact schema:
{
  "title": "string — punchy YouTube title under 70 chars, no clickbait, includes the topic naturally",
  "hook": "string — first 15 seconds of script, said to camera, hooks the viewer with a contrarian or surprising claim",
  "description": "string — 2-3 paragraph YouTube description optimized for AI engine citation. Uses keywords from the sub-queries naturally. No fluff.",
  "chapters": [
    {
      "timestamp": "0:00 / 1:30 / 3:45 etc",
      "title": "string — chapter title that mirrors how AI engines fan out the question",
      "sub_query_source": "string — the actual AI sub-query this chapter answers, copied from input",
      "talking_points": ["3-5 bullet points the host should cover in this chapter"]
    }
  ],
  "b_roll": ["string — 5-8 specific shot ideas, phone-shootable"],
  "thumbnail_concept": "string — one sentence describing the thumbnail",
  "tags": ["8-12 youtube tags"]
}

Rules:
- Each chapter title MUST be derived from one of the ai_engine_sub_queries — that is the entire point. Citation depends on it.
- 6-8 chapters total. Total runtime should feel like 8-12 minutes.
- Hook must NOT start with "In this video" or "Today we're".
- Be specific about the brand's actual products, not generic positioning.
- Output ONLY the JSON, no preamble, no code fences.`;
}
