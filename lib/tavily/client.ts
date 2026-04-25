import "dotenv/config";

const KEY = process.env.TAVILY_API_KEY;
const BASE = "https://api.tavily.com";

export const hasTavily = Boolean(KEY);

export type TavilyResult = {
  url: string;
  title: string;
  content: string;
  score: number;
  published_date?: string;
};

export type TavilySearchOptions = {
  query: string;
  topic?: "general" | "news";
  search_depth?: "basic" | "advanced";
  max_results?: number;
  days?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  include_images?: boolean;
};

export async function tavilySearch(opts: TavilySearchOptions): Promise<{
  query: string;
  answer: string | null;
  results: TavilyResult[];
  images?: string[];
}> {
  if (!KEY) throw new Error("TAVILY_API_KEY missing in .env");
  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: KEY,
      query: opts.query,
      topic: opts.topic ?? "general",
      search_depth: opts.search_depth ?? "basic",
      max_results: opts.max_results ?? 5,
      days: opts.days,
      include_domains: opts.include_domains,
      exclude_domains: opts.exclude_domains,
      include_images: opts.include_images,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tavily search failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { query: string; answer: string | null; results: TavilyResult[]; images?: string[] };
  return data;
}
