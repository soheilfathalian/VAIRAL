import { generateJSON } from "../llm/client";
import type { BrandReportRow, DomainReportRow } from "../peec/types";
import type { Insight } from "./types";

type Args = {
  brandName: string;
  brandReport: BrandReportRow[];
  domainReport: DomainReportRow[];
  range: { start_date: string; end_date: string };
};

type ComputedFacts = {
  brand: string;
  date_range: { start_date: string; end_date: string };
  own: {
    visibility_pct: number;
    share_of_voice_pct: number;
    sentiment: number;
    position: number;
    mention_count: number;
  };
  ranks: {
    visibility_rank: string;
    share_of_voice_rank: string;
    sentiment_rank: string;
    position_rank: string;
  };
  category_leaders: {
    visibility_leader: { name: string; visibility_pct: number };
    share_of_voice_leader: { name: string; share_of_voice_pct: number };
    sentiment_leader: { name: string; sentiment: number };
    position_leader: { name: string; position: number };
  };
  pattern_flags: string[];
  top_3_source_domains: { domain: string; classification: string; retrieval_count: number }[];
};

export async function buildInsight(args: Args): Promise<Insight> {
  const { brandName, brandReport, domainReport, range } = args;

  const own = brandReport.find((r) => r.brand.name === brandName);
  if (!own) {
    return {
      headline: `${brandName} not found in brand report`,
      subhead: "Check that this brand is configured with is_own:true in Peec.",
      evidence: [],
    };
  }

  const facts = computeFacts(brandName, brandReport, domainReport, range);

  return generateJSON<Insight>({
    system: insightSystem(),
    user: JSON.stringify(facts, null, 2),
    temperature: 0.5,
  });
}

function computeFacts(brand: string, report: BrandReportRow[], domains: DomainReportRow[], range: { start_date: string; end_date: string }): ComputedFacts {
  const own = report.find((r) => r.brand.name === brand)!;
  const total = report.length;

  // Lower position number = better rank, so sort ascending for position
  const byVisibility = [...report].sort((a, b) => b.visibility - a.visibility);
  const bySoV = [...report].sort((a, b) => b.share_of_voice - a.share_of_voice);
  const bySentiment = [...report].sort((a, b) => b.sentiment - a.sentiment);
  const byPosition = [...report].sort((a, b) => a.position - b.position);

  const rank = (sorted: BrandReportRow[]) => sorted.findIndex((r) => r.brand.name === brand) + 1;
  const rankStr = (r: number) => `${r} of ${total}${r === 1 ? " (best)" : r === total ? " (worst)" : ""}`;

  const flags: string[] = [];
  if (rank(byPosition) === 1 && own.visibility < 0.30) flags.push("BEST_POSITION_LOW_VISIBILITY: brand wins on quality but loses on frequency — distribution problem, not reputation problem");
  if (rank(byVisibility) === 1 && rank(byPosition) > total / 2) flags.push("HIGH_VISIBILITY_BAD_POSITION: mentioned often but always far down — reputation/messaging problem");
  if (own.sentiment >= 75 && own.visibility < 0.20) flags.push("HIGH_SENTIMENT_LOW_VISIBILITY: AI loves the brand but rarely surfaces it — needs more cited sources");
  if (own.sentiment < 55) flags.push("LOW_SENTIMENT: AI consistently describes the brand negatively — investigate the cited sources driving this");
  if (rank(bySoV) === 1) flags.push("DOMINANT_SOV: leading the category in mention share");
  if (rank(byVisibility) > total / 2 && rank(byPosition) > total / 2) flags.push("INVISIBLE_AND_LOW_RANKED: both quality and frequency need work");

  return {
    brand,
    date_range: range,
    own: {
      visibility_pct: Number((own.visibility * 100).toFixed(1)),
      share_of_voice_pct: Number((own.share_of_voice * 100).toFixed(1)),
      sentiment: own.sentiment,
      position: Number(own.position.toFixed(2)),
      mention_count: own.mention_count,
    },
    ranks: {
      visibility_rank: rankStr(rank(byVisibility)),
      share_of_voice_rank: rankStr(rank(bySoV)),
      sentiment_rank: rankStr(rank(bySentiment)),
      position_rank: rankStr(rank(byPosition)),
    },
    category_leaders: {
      visibility_leader: { name: byVisibility[0].brand.name, visibility_pct: Number((byVisibility[0].visibility * 100).toFixed(1)) },
      share_of_voice_leader: { name: bySoV[0].brand.name, share_of_voice_pct: Number((bySoV[0].share_of_voice * 100).toFixed(1)) },
      sentiment_leader: { name: bySentiment[0].brand.name, sentiment: bySentiment[0].sentiment },
      position_leader: { name: byPosition[0].brand.name, position: Number(byPosition[0].position.toFixed(2)) },
    },
    pattern_flags: flags,
    top_3_source_domains: [...domains]
      .sort((a, b) => b.retrieval_count - a.retrieval_count)
      .slice(0, 3)
      .map((d) => ({ domain: d.domain, classification: d.classification, retrieval_count: d.retrieval_count })),
  };
}

function insightSystem(): string {
  return `You are an AI search analyst. You write the single sharpest insight that frames a brand's situation in AI search.

The user input is a STRUCTURED FACT BUNDLE — pre-computed. Your job is to interpret it into one tight paragraph, not recompute or re-rank anything.

Key facts to lean on:
- "ranks" tells you where the brand stands on each metric (rank 1 is always best, including for position).
- "pattern_flags" identifies any classic competitive shape that applies — use them to anchor the headline.
- "category_leaders" name the brands winning each dimension. Reference them by name when relevant.
- For position: rank 1 means best (listed first in answers); higher rank = worse.

Output JSON matching this exact schema:
{
  "headline": "string — single punchy sentence (max 100 chars), the strategic insight",
  "subhead": "string — 1-2 sentences with supporting numbers and the immediate implication",
  "evidence": [
    { "metric": "string", "value": "string with units" },
    ... 4 items, the 4 most diagnostic for THIS situation
  ]
}

Rules:
- Headline must be specific to THIS brand's situation. No generic strategy clichés.
- If a pattern_flag applies, the headline should reflect it.
- For evidence, pick a mix that tells the story (e.g. own metric + competitor metric + rank + opportunity).
- Don't restate the input — interpret it.
- Output ONLY the JSON. No preamble, no code fences.`;
}
