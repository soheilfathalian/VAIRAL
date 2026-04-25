import "dotenv/config";
import { readFile } from "node:fs/promises";
import { tavilySearch, hasTavily } from "../lib/tavily/client";
import type { Slate } from "../lib/pipeline/types";

if (!hasTavily) {
  console.error("\nTAVILY_API_KEY missing in .env — get one at https://tavily.com\n");
  process.exit(1);
}

console.log(`\n${"━".repeat(72)}`);
console.log(`  Vairal × Tavily — fresh news layer for Shorts wedges`);
console.log(`${"━".repeat(72)}\n`);

let slate: Slate;
try {
  slate = JSON.parse(await readFile("data/slate/latest.json", "utf8")) as Slate;
} catch {
  console.error("No slate found — run `npm run slate` first.\n");
  process.exit(1);
}

console.log(`Brand: ${slate.brand.name}`);
console.log(`Slate generated: ${new Date(slate.generated_at).toLocaleString()}\n`);

if (slate.shorts.length === 0) {
  console.log("Slate has no shorts to enrich.\n");
  process.exit(0);
}

for (let i = 0; i < slate.shorts.length; i++) {
  const s = slate.shorts[i];
  const wedge = s.competitor_wedge;
  // Hot-take queries work best with just the competitor name + a simple negative anchor
  // — the "weak_topic" field is often localized or jargon-y, which pollutes news retrieval.
  const query = `${wedge.name} criticism review problems controversy`;

  console.log(`${"─".repeat(72)}`);
  console.log(`  Short ${i + 1}/${slate.shorts.length}  ·  vs ${wedge.name}  (${wedge.weak_topic})`);
  console.log(`${"─".repeat(72)}\n`);

  console.log(`  Original hook:  "${s.hook}"`);
  console.log(`  Tavily query:   "${query}"\n`);

  const fresh = await tavilySearch({
    query,
    topic: "news",
    days: 14,
    max_results: 3,
  });

  if (fresh.results.length === 0) {
    console.log("  (no fresh news found — keep the original hook)\n");
    continue;
  }

  console.log(`  Fresh news (last 14 days):\n`);
  for (const r of fresh.results) {
    const date = r.published_date ? new Date(r.published_date).toLocaleDateString() : "?";
    console.log(`    • [${date}] ${r.title}`);
    console.log(`      ${r.url}`);
    const snippet = (r.content ?? "").replace(/\s+/g, " ").trim().slice(0, 180);
    console.log(`      "${snippet}..."`);
    console.log();
  }

  console.log(`  💡 How Vairal would remix this Short:`);
  const top = fresh.results[0];
  if (top) {
    const date = top.published_date ? new Date(top.published_date).toLocaleDateString() : "this week";
    console.log(`     Replace the hook with a reference to "${top.title}" (${date})`);
    console.log(`     The Short now rides a real news cycle instead of speaking generically.\n`);
  }
}

console.log(`${"━".repeat(72)}`);
console.log(`  Done. Wire this into lib/pipeline/shorts.ts to make every slate timely.`);
console.log(`${"━".repeat(72)}\n`);
