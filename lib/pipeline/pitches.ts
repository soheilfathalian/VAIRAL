import { peec } from "../peec/client";
import { generateJSON } from "../llm/client";
import type { ChannelPitch } from "./types";
import type { UrlReportRow } from "../peec/types";

type Args = {
  projectId: string;
  ownBrandName: string;
  range: { start_date: string; end_date: string };
};

type ChannelAggregate = {
  channel_title: string;
  channel_url: string;
  total_retrievals: number;
  total_citations: number;
  videos: { url: string; title: string; retrievals: number; citation_count: number }[];
};

export async function buildPitches(args: Args): Promise<ChannelPitch[]> {
  const { projectId, ownBrandName, range } = args;

  const urls = await peec.urlReport(projectId, { ...range, limit: 200 });
  const yt = urls.filter((u) => u.url.includes("youtube.com") && u.channel_title);
  const byChannel = new Map<string, ChannelAggregate>();
  for (const u of yt) {
    const key = u.channel_title!;
    const channelUrl = `https://youtube.com/@${key.replace(/\s+/g, "")}`;
    const cur = byChannel.get(key) ?? {
      channel_title: key,
      channel_url: channelUrl,
      total_retrievals: 0,
      total_citations: 0,
      videos: [],
    };
    cur.total_retrievals += u.retrievals;
    cur.total_citations += u.citation_count;
    cur.videos.push({ url: u.url, title: u.title, retrievals: u.retrievals, citation_count: u.citation_count });
    byChannel.set(key, cur);
  }
  const ranked = [...byChannel.values()]
    .sort((a, b) => b.total_retrievals + b.total_citations - (a.total_retrievals + a.total_citations))
    .slice(0, 5);

  if (ranked.length === 0) return [];

  return generateJSON<ChannelPitch[]>({
    system: pitchesSystem(ownBrandName),
    user: JSON.stringify({ brand: ownBrandName, candidates: ranked }, null, 2),
  });
}

function pitchesSystem(brand: string): string {
  return `You are an outreach strategist helping ${brand} pitch guest appearances and collaborations to the YouTube creators most cited by AI search engines for their category.

For each candidate channel, write a pitch optimized to land. The creator is busy — your pitch must be short, specific, and show you've actually watched their work.

Output must be a JSON array, one object per candidate, matching:
{
  "channel_title": "string — copied from input",
  "channel_url": "string — copied from input",
  "why_it_matters": {
    "retrievals": number,
    "citation_count": number,
    "sample_video": "string — title of one of their cited videos, copied from input"
  },
  "pitch_angle": "string — one sentence on the unique angle for this specific creator (their style, audience, recent video)",
  "email_subject": "string — under 60 chars, specific, no clickbait",
  "email_body": "string — 4-6 short paragraphs. Opens by referencing one of their actual cited videos. Proposes ONE concrete collaboration (guest appearance, product loan, joint video). Ends with a low-friction CTA."
}

Tone: genuine peer-to-peer, no marketer-speak. No 'I hope this email finds you well'. No 'I'm reaching out because'. Get to the point.

Output ONLY the JSON array, no preamble, no code fences.`;
}
