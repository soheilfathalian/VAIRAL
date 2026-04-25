import { peec, dateRange } from "../peec/client";
import { buildInsight } from "./insight";
import { buildLongFormBrief } from "./long-form";
import { buildShorts } from "./shorts";
import { buildPitches } from "./pitches";
import { computeGapAnalysis } from "./gap-analysis";
import type { Slate } from "./types";

export async function generateSlate(projectId: string, days = 30): Promise<Slate> {
  const range = dateRange(days);

  const [brands, topics, brandReport, domainReport] = await Promise.all([
    peec.listBrands(projectId),
    peec.listTopics(projectId),
    peec.brandReport(projectId, { ...range, limit: 50 }),
    peec.domainReport(projectId, { ...range, limit: 30 }),
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

  // Pure computation — no extra API call, domain report already fetched above
  const gapAnalysis = computeGapAnalysis(domainReport, own, brands);

  console.log(`\n[slate] Brand: ${own.name}`);
  console.log(`[slate] Topics: ${topics.length} · Brands tracked: ${brands.length} · Brand report rows: ${brandReport.length}`);
  console.log(`[slate] Source gaps computed: ${gapAnalysis.total_gaps_found} gaps found, top ${gapAnalysis.gaps.length} surfaced`);
  console.log(`[slate] Generating insight + tracks sequentially (Gemini free-tier RPM)...\n`);

  console.log(`[slate]   1/4 insight...`);
  const insight = await buildInsight({ brandName: own.name, brandReport, domainReport, range });
  console.log(`[slate]   ✓ ${insight.headline}`);

  console.log(`[slate]   2/4 long-form brief...`);
  const longForm = await buildLongFormBrief({ projectId, ownBrandName: own.name, topics, brandReport, range });
  console.log(`[slate]   ✓ ${longForm.title}`);

  console.log(`[slate]   3/4 shorts...`);
  const shorts = await buildShorts({ projectId, ownBrandName: own.name, topics, brandReport, range });
  console.log(`[slate]   ✓ ${shorts.length} shorts scripts`);

  console.log(`[slate]   4/4 channel pitches...`);
  const pitches = await buildPitches({ projectId, ownBrandName: own.name, range });
  console.log(`[slate]   ✓ ${pitches.length} pitches`);

  return {
    generated_at: new Date().toISOString(),
    brand: { id: own.id, name: own.name },
    project_id: projectId,
    date_range: range,
    headline_insight: insight,
    long_form: longForm,
    shorts,
    pitches,
    gap_analysis: gapAnalysis,
  };
}
