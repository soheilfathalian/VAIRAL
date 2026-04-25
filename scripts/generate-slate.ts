import "dotenv/config";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { peec, dateRange } from "../lib/peec/client.js";
import { resolveProject } from "../lib/peec/projects.js";
import { headlineInsight } from "../lib/pipeline/insight.js";
import { hasLLM } from "../lib/llm/client.js";
import { generateSlate } from "../lib/pipeline/slate.js";
import type { Slate } from "../lib/pipeline/types.js";

const arg = process.argv[2];
const target = resolveProject(arg);

console.log(`\n[vairal] Target project: ${target.label} (${target.id})`);

const OUT_DIR = "data/slate";

async function dataOnlySlate(projectId: string): Promise<Slate> {
  console.log("[vairal] No GEMINI_API_KEY — running data-only mode\n");
  const range = dateRange(30);
  const [brands, topics, brandReport, urlReport] = await Promise.all([
    peec.listBrands(projectId),
    peec.listTopics(projectId),
    peec.brandReport(projectId, { ...range, limit: 50 }),
    peec.urlReport(projectId, { ...range, limit: 200 }),
  ]);
  const own = brands.find((b) => b.is_own);
  if (!own) throw new Error(`No own brand (is_own:true) found in project ${projectId}`);
  const insight = headlineInsight(brandReport, own.name);
  const yt = urlReport.filter((u) => u.url.includes("youtube.com") && u.channel_title);

  return {
    generated_at: new Date().toISOString(),
    brand: { id: own.id, name: own.name },
    project_id: projectId,
    date_range: range,
    headline_insight: insight,
    long_form: {
      topic: topics[0]?.name ?? "TBD",
      topic_id: topics[0]?.id ?? "",
      title: "[Awaiting GEMINI_API_KEY for slate generation]",
      hook: "",
      description: "",
      chapters: [],
      b_roll: [],
      thumbnail_concept: "",
      tags: [],
      target_prompts: [],
      citation_targets: yt.slice(0, 5).map((u) => ({
        url: u.url,
        channel_title: u.channel_title,
        why: `${u.retrievals} retrievals, ${u.citation_count} citations`,
      })),
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
  };
}

const slate = hasLLM ? await generateSlate(target.id) : await dataOnlySlate(target.id);

await mkdir(OUT_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const path = join(OUT_DIR, `${target.alias}-${stamp}.json`);
const latest = join(OUT_DIR, "latest.json");
await writeFile(path, JSON.stringify(slate, null, 2));
await writeFile(latest, JSON.stringify(slate, null, 2));

console.log(`\n[vairal] ✓ Generated for ${slate.brand.name}`);
console.log(`[vairal]   headline:  ${slate.headline_insight.headline}`);
console.log(`[vairal]   long-form: ${slate.long_form.title}`);
console.log(`[vairal]   shorts:    ${slate.shorts.length}`);
console.log(`[vairal]   pitches:   ${slate.pitches.length}`);
console.log(`[vairal]   saved:     ${path}`);
console.log(`[vairal]   latest:    ${latest}\n`);
