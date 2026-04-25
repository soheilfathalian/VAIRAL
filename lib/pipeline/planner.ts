import type { Slate, WeeklyContentPlan, ContentItem } from "./types";

/**
 * Smartly distributes scripts from a Slate into a 7-day calendar.
 * Utilizes gap analysis, Tavily fresh news, and competitor remixes
 * to build a prioritized, non-repeating schedule.
 */
export function generateSmartPlan(slate: Slate): WeeklyContentPlan {
  const items: ContentItem[] = [];
  const start = new Date();

  // 1. Prepare Content Pools

  // A. Shorts (check for Tavily news urgency)
  const shortItems = slate.shorts.map((s) => {
    const isNews = !!s.fresh_news_anchor;
    return {
      type: "SHORT" as const,
      title: isNews ? `News Hijack: ${s.fresh_news_anchor!.title}` : s.topic,
      hook: s.hook,
      script: isNews
        ? `[News Anchor: ${s.fresh_news_anchor!.snippet}]\n\n${s.hook} ${s.claim} ${s.payoff}`
        : `${s.hook} ${s.claim} ${s.payoff}`,
      metadata: {
        topic: s.topic,
        hashtags: s.hashtags,
        platforms: ["YOUTUBE", "TIKTOK", "INSTAGRAM"] as ("YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "X")[],
        is_urgent: isNews,
      },
    };
  });

  // B. Gap Analysis Actions (surfacing missing domains as actionable pitch items)
  const gapItems = (slate.gap_analysis?.gaps || []).map((gap) => ({
    type: "PITCH_PROMO" as const,
    title: `Gap: ${gap.domain}`,
    hook: `Recommended action: ${gap.recommended_action}`,
    script: `Format: ${gap.content_format}\nCompetitors present: ${gap.competitors_present.join(
      ", "
    )}\n\nAction: Execute distribution play on ${gap.domain}.`,
    metadata: {
      topic: "Distribution",
      hashtags: [gap.classification],
      platforms: [] as ("YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "X")[],
    },
  }));

  // C. Competitor Remixes (counter-narrative content)
  const remixItems = (slate.remixes || []).map((r) => ({
    type: "REMIX" as const,
    title: `Remix: ${r.remix_angle}`,
    hook: r.hook,
    script: r.script,
    metadata: {
      topic: "Counter-narrative",
      hashtags: [],
      platforms: ["YOUTUBE", "TIKTOK", "X"] as ("YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "X")[],
    },
  }));

  // D. Low Sentiment Shorts
  const lowSentimentItems = (slate.low_sentiment_shorts || []).map((s) => ({
    type: "SHORT" as const,
    title: `Combat: ${s.topic}`,
    hook: s.hook,
    script: `${s.hook} ${s.claim} ${s.payoff}`,
    metadata: {
      topic: s.topic,
      hashtags: s.hashtags,
      platforms: ["YOUTUBE", "TIKTOK", "INSTAGRAM"] as ("YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "X")[],
      is_urgent: false,
      is_low_sentiment: true,
    },
  }));

  // 2. Build prioritized queues
  // We want to guarantee at least one Short per day.
  const shortsQueue = [
    ...lowSentimentItems,
    ...shortItems.filter((s) => s.metadata.is_urgent),
    ...shortItems.filter((s) => !s.metadata.is_urgent),
  ];
  const otherQueue = [...gapItems, ...remixItems];

  // Find Thursday (0 = Sunday, 1 = Monday, ..., 4 = Thursday)
  let thursdayOffset = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 4) {
      thursdayOffset = i;
      break;
    }
  }

  const scheduledDays = new Set<number>();

  // A. Lock the Q&A Cluster to Thursday (if exists)
  if (slate.qna_clusters && slate.qna_clusters.length > 0) {
    const cluster = slate.qna_clusters[0];
    const dStart = new Date(start);
    dStart.setDate(dStart.getDate() + thursdayOffset);

    // 9:00 AM - The Reddit Seed
    items.push({
      id: `item_cluster_0`,
      type: "REDDIT_POST" as const,
      title: `CEO Q&A`,
      hook: cluster.items.reddit_post.title,
      script: cluster.items.reddit_post.body,
      metadata: { topic: "Q&A", hashtags: ["AMA"], platforms: ["REDDIT"] as any[], is_urgent: false },
      scheduled_at: (() => {
        const d = new Date(dStart);
        d.setHours(9, 0, 0, 0);
        return d.toISOString();
      })(),
      status: "PLANNED",
    });

    // 13:00 PM - The Initial React
    items.push({
      id: `item_cluster_1`,
      type: "SHORT" as const,
      title: `React: Q&A 1`,
      hook: cluster.items.short_react_1.hook,
      script: `${cluster.items.short_react_1.hook} ${cluster.items.short_react_1.script}`,
      metadata: { topic: "Q&A", hashtags: ["React"], platforms: ["YOUTUBE", "TIKTOK", "INSTAGRAM"] as any[], is_urgent: false },
      scheduled_at: (() => {
        const d = new Date(dStart);
        d.setHours(13, 0, 0, 0);
        return d.toISOString();
      })(),
      status: "PLANNED",
    });

    // 19:00 PM - The Second React
    items.push({
      id: `item_cluster_2`,
      type: "SHORT" as const,
      title: `React: Q&A 2`,
      hook: cluster.items.short_react_2.hook,
      script: `${cluster.items.short_react_2.hook} ${cluster.items.short_react_2.script}`,
      metadata: { topic: "Q&A", hashtags: ["React"], platforms: ["YOUTUBE", "TIKTOK", "INSTAGRAM"] as any[], is_urgent: false },
      scheduled_at: (() => {
        const d = new Date(dStart);
        d.setHours(19, 0, 0, 0);
        return d.toISOString();
      })(),
      status: "PLANNED",
    });

    scheduledDays.add(thursdayOffset);
  }

  // B. Distribute remaining days
  // We guarantee 1 Short in the morning, and 1 Gap/Remix in the afternoon.
  for (let d = 0; d < 7; d++) {
    if (scheduledDays.has(d)) continue;

    const dStart = new Date(start);
    dStart.setDate(dStart.getDate() + d);

    // Morning Slot (9:00) -> Pull from shorts first
    const morningItem = shortsQueue.shift() || otherQueue.shift();
    if (morningItem) {
      const d1 = new Date(dStart);
      d1.setHours(9, 0, 0, 0);
      items.push({
        ...morningItem,
        id: `item_${d}_0`,
        scheduled_at: d1.toISOString(),
        status: "PLANNED",
      });
    }

    // Afternoon Slot (16:00) -> Pull from Gaps/Remixes first
    const afternoonItem = otherQueue.shift() || shortsQueue.shift();
    if (afternoonItem) {
      const d2 = new Date(dStart);
      d2.setHours(16, 0, 0, 0);
      items.push({
        ...afternoonItem,
        id: `item_${d}_1`,
        scheduled_at: d2.toISOString(),
        status: "PLANNED",
      });
    }
  }

  return {
    items,
    generated_at: new Date().toISOString(),
    brand: slate.brand,
  };
}
