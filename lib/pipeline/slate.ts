import { peec, dateRange } from "../peec/client";
import { headlineInsight } from "./insight";
import { buildLongFormBrief } from "./long-form";
import { buildShorts } from "./shorts";
import { buildPitches } from "./pitches";
import type { Slate } from "./types";

export async function generateSlate(projectId: string, days = 30): Promise<Slate> {
  const range = dateRange(days);

  const [brands, topics, brandReport] = await Promise.all([
    peec.listBrands(projectId),
    peec.listTopics(projectId),
    peec.brandReport(projectId, { ...range, limit: 50 }),
  ]);

  const own = brands.find((b) => b.is_own);
  if (!own) throw new Error(`No own brand found in project ${projectId}`);

  const insight = headlineInsight(brandReport, own.name);

  console.log(`\n[slate] Brand: ${own.name}`);
  console.log(`[slate] ${insight.headline}`);
  console.log(`[slate] Generating tracks in parallel...\n`);

  const [longForm, shorts, pitches] = await Promise.all([
    buildLongFormBrief({ projectId, ownBrandName: own.name, topics, brandReport, range }),
    buildShorts({ projectId, ownBrandName: own.name, topics, brandReport, range }),
    buildPitches({ projectId, ownBrandName: own.name, range }),
  ]);

  return {
    generated_at: new Date().toISOString(),
    brand: { id: own.id, name: own.name },
    project_id: projectId,
    date_range: range,
    headline_insight: insight,
    long_form: longForm,
    shorts,
    pitches,
  };
}
