import { peec, dateRange } from "../lib/peec/client.js";

const PROJECT = process.env.PEEC_PROJECT_NOTHING!;
if (!PROJECT) throw new Error("PEEC_PROJECT_NOTHING missing");

const range = dateRange(30);

console.log(`\n=== Smoke test: Nothing project (${PROJECT})\n`);

const [brands, topics, models] = await Promise.all([
  peec.listBrands(PROJECT),
  peec.listTopics(PROJECT),
  peec.listModels(PROJECT),
]);

console.log(`Brands (${brands.length}):`, brands.map((b) => `${b.name}${b.is_own ? " ⭐" : ""}`).join(", "));
console.log(`Topics (${topics.length}):`, topics.map((t) => t.name).join(", "));
console.log(`Active models:`, models.filter((m) => m.is_active).map((m) => m.name).join(", "));

console.log(`\n=== Brand report (last 30d)\n`);
const brandRpt = await peec.brandReport(PROJECT, { ...range, limit: 20 });
for (const b of brandRpt) {
  console.log(
    `${b.brand.name.padEnd(15)} sov=${(b.share_of_voice * 100).toFixed(1)}%  viz=${(b.visibility * 100).toFixed(1)}%  sent=${b.sentiment}  pos=${b.position.toFixed(2)}`
  );
}

console.log(`\n=== Top YouTube channels in citation data\n`);
const urlRpt = await peec.urlReport(PROJECT, { ...range, limit: 50 });
const yt = urlRpt.filter((u) => u.url.includes("youtube.com") && u.channel_title);
for (const u of yt.slice(0, 10)) {
  console.log(`[${u.channel_title}] ${u.title}\n  ${u.url}  retrievals=${u.retrievals} citations=${u.citation_count}\n`);
}

console.log(`=== Sample fanout queries\n`);
const fan = await peec.fanoutSearch(PROJECT, { ...range, limit: 8 });
for (const q of fan) {
  console.log(`(${q.model.id}) ${q.query.text}`);
}

console.log(`\n✓ All endpoints working\n`);
