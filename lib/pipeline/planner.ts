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
        is_competitor_attack: true,
      },
    };
  });

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
  const shortsQueue: any[] = [];
  const lowSent = [...lowSentimentItems];
  const attacks = [
    ...shortItems.filter((s) => s.metadata.is_urgent),
    ...shortItems.filter((s) => !s.metadata.is_urgent),
  ];

  // Interleave to spread them out
  while (lowSent.length > 0 || attacks.length > 0) {
    if (lowSent.length > 0) shortsQueue.push(lowSent.shift()!);
    if (attacks.length > 0) shortsQueue.push(attacks.shift()!);
  }

  const otherQueue = [...remixItems];
  const masterQueue = [...shortsQueue, ...otherQueue];

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
  const availableDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !scheduledDays.has(d));
  
  const assignedPerDay = new Map<number, any[]>();
  for (const d of availableDays) assignedPerDay.set(d, []);

  // First pass: 1 item per day to guarantee daily cadence
  for (const d of availableDays) {
    if (masterQueue.length > 0) {
      assignedPerDay.get(d)!.push(masterQueue.shift()!);
    }
  }

  // Second pass: distribute remaining, avoiding same type on same day
  while (masterQueue.length > 0) {
    const item = masterQueue.shift()!;
    let bestDay = availableDays[0];
    let bestScore = -1000;

    for (const d of availableDays) {
      const dayItems = assignedPerDay.get(d)!;
      const countScore = -dayItems.length * 10; // prefer days with fewer items
      
      const hasSameType = dayItems.some(
        (i: any) => (i.metadata.is_low_sentiment === (item.metadata as any).is_low_sentiment) && 
             (i.metadata.is_competitor_attack === (item.metadata as any).is_competitor_attack)
      );
      const typeScore = hasSameType ? -5 : 0;
      
      const dStart = new Date(start);
      dStart.setDate(dStart.getDate() + d);
      const isWeekend = dStart.getDay() === 0 || dStart.getDay() === 6;
      // Heavy penalty for assigning a second item to a weekend
      const weekendPenalty = (dayItems.length > 0 && isWeekend) ? -20 : 0;
      
      const score = countScore + typeScore + weekendPenalty;
      if (score > bestScore) {
        bestScore = score;
        bestDay = d;
      }
    }
    
    assignedPerDay.get(bestDay)!.push(item);
  }

  // Convert map to final schedule
  for (const d of availableDays) {
    const dayItems = assignedPerDay.get(d)!;
    
    // Sort so Combat Low Sentiment comes first
    dayItems.sort((a, b) => {
      const aLow = (a.metadata as any).is_low_sentiment ? 1 : 0;
      const bLow = (b.metadata as any).is_low_sentiment ? 1 : 0;
      return bLow - aLow; // 1 before 0
    });

    for (let idx = 0; idx < dayItems.length; idx++) {
      const item = dayItems[idx];
      const dStart = new Date(start);
      dStart.setDate(dStart.getDate() + d);
      
      const hours = [9, 13, 18];
      dStart.setHours(hours[Math.min(idx, 2)], 0, 0, 0);

      items.push({
        ...item,
        id: `item_${d}_${idx}`,
        scheduled_at: dStart.toISOString(),
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
