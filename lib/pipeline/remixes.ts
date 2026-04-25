import { peec } from "../peec/client";
import { generateJSON } from "../llm/client";
import type { RemixScript } from "./types";
import type { UrlReportRow, Brand } from "../peec/types";

type Args = {
  projectId: string;
  ownBrand: Brand;
  allBrands: Brand[];
  urlReport: UrlReportRow[];
};

export async function buildRemixes(args: Args): Promise<RemixScript[]> {
  const { projectId, ownBrand, allBrands, urlReport } = args;

  // 1. Find a highly retrieved URL that mentions competitors but NOT us.
  const ownId = ownBrand.id;
  const gapUrls = urlReport.filter(u => {
    const mentioned = u.mentioned_brands.map(b => b.id);
    if (mentioned.includes(ownId)) return false; // We are already here
    const hasCompetitor = mentioned.some(id => allBrands.some(b => !b.is_own && b.id === id));
    return hasCompetitor && u.retrievals > 0;
  }).sort((a, b) => b.retrievals - a.retrievals);

  if (gapUrls.length === 0) return [];

  const targetUrl = gapUrls[0];
  const compBrands = targetUrl.mentioned_brands
    .map(b => allBrands.find(a => a.id === b.id)?.name)
    .filter(Boolean) as string[];

  // 2. Fetch the actual content
  let sourceContent = "";
  try {
    const contentRes = await peec.urlContent(projectId, { url: targetUrl.url, max_length: 5000 });
    sourceContent = contentRes.content;
  } catch (e) {
    console.warn(`[remixes] Failed to fetch urlContent for ${targetUrl.url}: ${e}`);
    return [];
  }

  if (!sourceContent || sourceContent.length < 100) return [];

  // 3. Ask Gemini to remix it
  return generateJSON<RemixScript[]>({
    system: remixSystem(ownBrand.name),
    user: JSON.stringify({
      brand: ownBrand.name,
      competitors_mentioned: compBrands,
      source_url: targetUrl.url,
      source_title: targetUrl.title,
      source_content: sourceContent
    }, null, 2)
  });
}

function remixSystem(brand: string): string {
  return `You are a growth marketer for ${brand}. I am giving you the text of a highly cited piece of content that praises or discusses your competitors, but ignores ${brand}.

Your job is to read this competitor-focused content, extract its core themes, and "remix" it into 5 punchy short-form video scripts (or LinkedIn posts) that counter the narrative and position ${brand} as the better alternative.

Output MUST be a JSON array of 5 objects matching this schema:
{
  "source_url": "string — copied from input",
  "hook": "string — 0-3s opening line. Direct, punchy, references the topic of the source content.",
  "remix_angle": "string — what specific point from the source content are we countering?",
  "script": "string — 30-45 second script (about 70 words). Conversational, assertive, fan-perspective.",
  "format": "string — 'Short-form Video' or 'LinkedIn Post'"
}

Output ONLY the JSON array, no preamble, no code fences.`;
}
