import type { DomainReportRow, Brand } from "../peec/types";
import type { SourceGap, GapAnalysis } from "./types";
import { generateJSON } from "../llm/client";

// Map Peec's domain classifications to actionable content types
const ACTION_MAP: Record<string, { action: string; format: string }> = {
  UGC: {
    action: "Community post or creator collab",
    format: "Reddit thread, YouTube Shorts, TikTok",
  },
  EDITORIAL: {
    action: "PR / journalist pitch",
    format: "Press release, product loan, exclusive briefing",
  },
  CORPORATE: {
    action: "Partnership or directory listing",
    format: "Guest post, directory submission, co-marketing",
  },
  REFERENCE: {
    action: "Content correction or addition",
    format: "Wikipedia edit, spec-site submission, data update",
  },
  INSTITUTIONAL: {
    action: "Academic or institutional outreach",
    format: "White paper, research collaboration, case study",
  },
  OTHER: {
    action: "Content presence",
    format: "SEO-optimised page, brand mention outreach",
  },
};

/**
 * Compute which domains AI engines trust most where competitors appear but the brand is absent.
 * Uses the domain report already fetched in slate.ts — zero extra API calls.
 *
 * Gap Score = retrieved_percentage × citation_rate × competitor_count
 * (higher = more urgent to close the gap)
 */
export async function computeGapAnalysis(
  domainReport: DomainReportRow[],
  ownBrand: Brand,
  allBrands: Brand[]
): Promise<GapAnalysis> {
  const ownId = ownBrand.id;

  const gaps: SourceGap[] = [];

  for (const domain of domainReport) {
    // Skip domains that are the own brand's
    if (domain.classification === "You") continue;

    const mentionedIds = domain.mentioned_brands.map((b) => b.id);
    const youAreOnIt = mentionedIds.includes(ownId);
    if (youAreOnIt) continue; // already there — no gap

    const competitorBrands = allBrands.filter(
      (b) => !b.is_own && mentionedIds.includes(b.id)
    );
    if (competitorBrands.length === 0) continue; // nobody tracked there

    const gapScore = Number(
      (
        domain.retrieved_percentage *
        domain.citation_rate *
        competitorBrands.length
      ).toFixed(3)
    );

    const classification = (domain.classification ?? "OTHER").toUpperCase();
    const mapped = ACTION_MAP[classification] ?? ACTION_MAP["OTHER"];

    gaps.push({
      domain: domain.domain,
      classification: domain.classification ?? "Other",
      retrieved_percentage: Number((domain.retrieved_percentage * 100).toFixed(1)),
      retrieval_rate: Number(domain.retrieval_rate.toFixed(3)),
      citation_rate: Number(domain.citation_rate.toFixed(2)),
      competitors_present: competitorBrands.map((b) => b.name),
      gap_score: gapScore,
      recommended_action: mapped.action,
      content_format: mapped.format,
    });
  }

  // Sort by urgency — highest gap score first
  gaps.sort((a, b) => b.gap_score - a.gap_score);

  const candidates = gaps.slice(0, 15); // get top 15 candidates to judge

  if (candidates.length === 0) {
    return { gaps: [], total_gaps_found: 0, summary: buildSummary([], ownBrand.name) };
  }

  // LLM Judge to filter out competitor-owned or irrelevant domains
  const systemPrompt = `You are a strict outreach strategist for the brand "${ownBrand.name}".
Your job is to review a list of domains where AI engines cite your competitors but NOT you.
You must return a JSON array containing ONLY the domains that make sense to legitimately pitch, partner with, or list on.

CRITICAL RULES FOR REJECTION:
1. REJECT if the domain is owned by a direct competitor (e.g., 'samsung.com', 'apple.com', or 'huawei.com' if you are a phone brand). You cannot pitch your competitor's own website.
2. REJECT if the domain is a broad marketplace/retailer where a PR pitch makes no sense (e.g., 'amazon.com').
3. REJECT if the domain is fundamentally unpitchable for PR/Partnerships.

Return a JSON array of strings containing ONLY the approved domains.
Example output: ["whathifi.com", "rtings.com", "theverge.com"]
Output ONLY the JSON array, no markdown fences.`;

  let approvedDomains: string[] = [];
  try {
    approvedDomains = await generateJSON<string[]>({
      system: systemPrompt,
      user: JSON.stringify(candidates.map(c => c.domain)),
      temperature: 0.1,
    });
  } catch (error) {
    console.warn("[gap-analysis] LLM judge failed, falling back to unfiltered list:", error);
    approvedDomains = candidates.map(c => c.domain);
  }

  const validSet = new Set(approvedDomains);
  const filteredGaps = candidates.filter(g => validSet.has(g.domain));
  const top = filteredGaps.slice(0, 5);

  return {
    gaps: top,
    total_gaps_found: filteredGaps.length,
    summary: buildSummary(top, ownBrand.name),
  };
}

function buildSummary(gaps: SourceGap[], brandName: string): string {
  if (gaps.length === 0) return `${brandName} appears on all major AI-cited domains.`;

  const topDomain = gaps[0];
  const ugcCount = gaps.filter((g) => g.classification.toUpperCase() === "UGC").length;
  const editorialCount = gaps.filter((g) =>
    g.classification.toUpperCase() === "EDITORIAL"
  ).length;

  const parts: string[] = [
    `${brandName} is absent from ${gaps.length} high-trust domains where competitors are cited.`,
  ];

  if (topDomain) {
    parts.push(
      `Most urgent: ${topDomain.domain} (${topDomain.retrieved_percentage}% of AI chats retrieve it, ${topDomain.competitors_present.join(" & ")} appear there).`
    );
  }
  if (ugcCount > 0) parts.push(`${ugcCount} UGC platform gap${ugcCount > 1 ? "s" : ""} — direct community engagement opportunity.`);
  if (editorialCount > 0) parts.push(`${editorialCount} editorial gap${editorialCount > 1 ? "s" : ""} — PR outreach needed.`);

  return parts.join(" ");
}
