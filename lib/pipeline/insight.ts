import type { BrandReportRow } from "../peec/types.js";
import type { Insight } from "./types.js";

export function headlineInsight(report: BrandReportRow[], ownBrandName: string): Insight {
  const own = report.find((r) => r.brand.name === ownBrandName);
  if (!own) {
    return {
      headline: `${ownBrandName} not found in brand report`,
      subhead: "Check brand configuration.",
      evidence: [],
    };
  }
  const competitors = report.filter((r) => r.brand.name !== ownBrandName);
  const topByVisibility = [...competitors].sort((a, b) => b.visibility - a.visibility)[0];
  const ownPositionRank = [...report].sort((a, b) => a.position - b.position).findIndex((r) => r.brand.name === ownBrandName) + 1;
  const topPositionLeader = [...report].sort((a, b) => a.position - b.position)[0];

  if (ownPositionRank === 1 && own.visibility < 0.3) {
    return {
      headline: `${ownBrandName} wins when it shows up — the job is to show up more.`,
      subhead: `Best avg position in the category (${own.position.toFixed(2)}, ahead of ${topByVisibility.brand.name} at ${topByVisibility.position.toFixed(2)}) — but only ${(own.visibility * 100).toFixed(1)}% visibility vs ${topByVisibility.brand.name}'s ${(topByVisibility.visibility * 100).toFixed(1)}%.`,
      evidence: [
        { metric: "Avg position rank", value: `#${ownPositionRank} of ${report.length}` },
        { metric: "Visibility", value: `${(own.visibility * 100).toFixed(1)}%` },
        { metric: "Share of voice", value: `${(own.share_of_voice * 100).toFixed(1)}%` },
        { metric: "Sentiment", value: `${own.sentiment}/100` },
      ],
    };
  }

  return {
    headline: `${ownBrandName}: ${(own.visibility * 100).toFixed(1)}% visibility, position ${own.position.toFixed(2)}`,
    subhead: `Category leader by visibility is ${topByVisibility.brand.name} (${(topByVisibility.visibility * 100).toFixed(1)}%). Best position belongs to ${topPositionLeader.brand.name}.`,
    evidence: [
      { metric: "Visibility", value: `${(own.visibility * 100).toFixed(1)}%` },
      { metric: "Share of voice", value: `${(own.share_of_voice * 100).toFixed(1)}%` },
      { metric: "Sentiment", value: `${own.sentiment}/100` },
      { metric: "Avg position", value: own.position.toFixed(2) },
    ],
  };
}
