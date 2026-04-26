import { peec, dateRange } from "../peec/client";
import { buildInsight } from "./insight";
import { buildShorts } from "./shorts";
import { buildPitches } from "./pitches";
import { buildRemixes } from "./remixes";
import { buildQnaClusters } from "./qna-cluster";
import { buildLowSentimentShorts } from "./low-sentiment-shorts";
import { computeGapAnalysis } from "./gap-analysis";
import type { Slate } from "./types";

export async function generateSlate(projectId: string, days = 30): Promise<Slate> {
  const range = dateRange(days);

  const [brands, topics, brandReport, domainReport, urlReport] = await Promise.all([
    peec.listBrands(projectId),
    peec.listTopics(projectId),
    peec.brandReport(projectId, { ...range, limit: 50 }),
    peec.domainReport(projectId, { ...range, limit: 30 }),
    peec.urlReport(projectId, { ...range, limit: 100 }),
  ]);

  if (brandReport.length === 0) {
    throw new Error(
      `Project ${projectId} has no brand report data in the last ${days} days. ` +
        `The project may be new — Peec needs at least a week of scrape data before Vairal can analyse.`
    );
  }

  const own = brands.find((b) => b.is_own) ?? brands[0];
  if (!own) throw new Error(`Project ${projectId} has no brands configured`);
  if (!brands.some((b) => b.is_own)) {
    console.warn(`[slate] No is_own brand in project ${projectId}, falling back to first brand: ${own.name}`);
  }

  // Run gap analysis via LLM
  console.log(`[slate] Computing source gaps (with LLM validation)...`);
  const gapAnalysis = await computeGapAnalysis(domainReport, own, brands);

  console.log(`\n[slate] Brand: ${own.name}`);
  console.log(`[slate] Topics: ${topics.length} · Brands tracked: ${brands.length} · Brand report rows: ${brandReport.length}`);
  console.log(`[slate] Source gaps computed: ${gapAnalysis.total_gaps_found} gaps found, top ${gapAnalysis.gaps.length} surfaced`);
  console.log(`[slate] Generating insight + tracks sequentially (Gemini free-tier RPM)...\n`);

  console.log(`[slate]   1/5 insight...`);
  const insight = await buildInsight({ brandName: own.name, brandReport, domainReport, range });
  console.log(`[slate]   ✓ ${insight.headline}`);

  console.log(`[slate]   2/5 shorts...`);
  const shorts = await buildShorts({ projectId, ownBrandName: own.name, topics, brandReport, range });
  console.log(`[slate]   ✓ ${shorts.length} shorts scripts`);

  console.log(`[slate]   3/5 channel pitches...`);
  const pitches = await buildPitches({ projectId, ownBrandName: own.name, range });
  console.log(`[slate]   ✓ ${pitches.length} pitches`);

  console.log(`[slate]   4/5 competitor remixes...`);
  const remixes = await buildRemixes({ projectId, ownBrand: own, allBrands: brands, urlReport });
  console.log(`[slate]   ✓ ${remixes.length} remixes generated`);

  console.log(`[slate]   5/5 Q&A clusters and low sentiment shorts...`);
  const [qna_clusters, low_sentiment_shorts] = await Promise.all([
    buildQnaClusters({ ownBrandName: own.name }),
    buildLowSentimentShorts({ projectId, ownBrandName: own.name, topics, range }),
  ]);
  console.log(`[slate]   ✓ ${qna_clusters.length} Q&A cluster(s) generated`);
  console.log(`[slate]   ✓ ${low_sentiment_shorts.length} combat shorts generated`);

  return {
    generated_at: new Date().toISOString(),
    brand: { id: own.id, name: own.name },
    project_id: projectId,
    date_range: range,
    headline_insight: insight,
    shorts,
    remixes,
    pitches,
    gap_analysis: gapAnalysis,
    qna_clusters,
    low_sentiment_shorts,
  };
}
