import "dotenv/config";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { peec, dateRange } from "../lib/peec/client";
import { resolveProject, listProjects } from "../lib/peec/projects";
import { hasLLM } from "../lib/llm/client";
import { generateSlate } from "../lib/pipeline/slate";
import { computeGapAnalysis } from "../lib/pipeline/gap-analysis";
import type { Slate } from "../lib/pipeline/types";

const arg = process.argv[2];

if (arg === "--list" || arg === "-l") {
  const projects = await listProjects();
  console.log(`\n${projects.length} projects available:\n`);
  for (const p of projects) {
    console.log(`  ${p.id}  ${p.name}`);
  }
  console.log();
  process.exit(0);
}

const target = await resolveProject(arg);
console.log(`\n[vairal] Target project: ${target.name} (${target.id})`);

const OUT_DIR = "data/slate";

async function dataOnlySlate(projectId: string): Promise<Slate> {
  console.log("[vairal] No GEMINI_API_KEY — running data-only mode\n");
  const range = dateRange(30);
  const [brands, topics, brandReport, urlReport, domainReport] = await Promise.all([
    peec.listBrands(projectId),
    peec.listTopics(projectId),
    peec.brandReport(projectId, { ...range, limit: 50 }),
    peec.urlReport(projectId, { ...range, limit: 200 }),
    peec.domainReport(projectId, { ...range, limit: 30 }),
  ]);
  const own = brands.find((b) => b.is_own) ?? brands[0];
  if (!own) throw new Error(`Project ${projectId} has no brands configured`);
  const yt = urlReport.filter((u) => u.url.includes("youtube.com") && u.channel_title);

  return {
    generated_at: new Date().toISOString(),
    brand: { id: own.id, name: own.name },
    project_id: projectId,
    date_range: range,
    headline_insight: {
      headline: `${own.name}: data-only mode (set GEMINI_API_KEY for full analysis)`,
      subhead: `${brandReport.length} brand report rows, ${topics.length} topics, ${yt.length} YouTube channels in source data.`,
      evidence: [],
    },
    shorts: [],
    pitches: yt.slice(0, 5).map((u) => ({
      channel_title: u.channel_title!,
      channel_url: `https://youtube.com/@${u.channel_title!.replace(/\s+/g, "")}`,
      why_it_matters: { retrievals: u.retrievals, citation_count: u.citation_count, sample_video: u.title },
      pitch_angle: "[Awaiting GEMINI_API_KEY]",
      email_subject: "",
      email_body: "",
    })),
    remixes: [],
    qna_clusters: [],
    low_sentiment_shorts: [],
    gap_analysis: computeGapAnalysis(domainReport, own, brands),
  };
}

const slate = hasLLM ? await generateSlate(target.id) : await dataOnlySlate(target.id);

await mkdir(OUT_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const slug = target.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const path = join(OUT_DIR, `${slug}-${stamp}.json`);
const latest = join(OUT_DIR, "latest.json");
await writeFile(path, JSON.stringify(slate, null, 2));
await writeFile(latest, JSON.stringify(slate, null, 2));

console.log(`\n[vairal] ✓ Generated for ${slate.brand.name}`);
console.log(`[vairal]   headline:  ${slate.headline_insight.headline}`);
console.log(`[vairal]   shorts:    ${slate.shorts.length}`);
console.log(`[vairal]   remixes:   ${slate.remixes.length}`);
console.log(`[vairal]   pitches:   ${slate.pitches.length}`);
console.log(`[vairal]   gaps:      ${slate.gap_analysis.gaps.length} source gaps found`);
console.log(`[vairal]   saved:     ${path}`);
console.log(`[vairal]   latest:    ${latest}\n`);
