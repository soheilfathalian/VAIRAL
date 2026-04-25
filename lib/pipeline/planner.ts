import type { Slate, WeeklyContentPlan, ContentItem } from "./types";

/**
 * Smartly distributes scripts from a Slate into a 7-day calendar.
 * Targets 3 videos per day with specific time-slots.
 */
export function generateSmartPlan(slate: Slate): WeeklyContentPlan {
  const items: ContentItem[] = [];
  const start = new Date();
  
  // 1. Convert Slate to raw pool of content potential
  const pool: Omit<ContentItem, 'id' | 'scheduled_at' | 'status'>[] = [];
  
  // Add Shorts (High priority for reach)
  slate.shorts.forEach(s => pool.push({
    type: 'SHORT',
    title: s.topic,
    hook: s.hook,
    script: `${s.hook} ${s.claim} ${s.payoff}`,
    metadata: {
        topic: s.topic,
        hashtags: s.hashtags,
        platforms: ['YOUTUBE', 'TIKTOK', 'INSTAGRAM']
    }
  }));

  // Add Chapters (Educational/Authority content)
  slate.long_form.chapters.forEach(c => pool.push({
    type: 'LONG_FORM_CHAPTER',
    title: c.title,
    hook: c.title,
    script: c.talking_points.join('. '),
    metadata: {
        topic: slate.long_form.topic,
        hashtags: slate.long_form.tags,
        platforms: ['YOUTUBE']
    }
  }));

  // Add Full Long Form (Deep authority)
  pool.push({
    type: 'LONG_FORM_FULL',
    title: slate.long_form.title,
    hook: slate.long_form.hook,
    script: `${slate.long_form.hook}. ${slate.long_form.description}`,
    metadata: {
        topic: slate.long_form.topic,
        hashtags: slate.long_form.tags,
        platforms: ['YOUTUBE']
    }
  });

  // 2. Distribute 3 per day for 7 days (21 total slots)
  // Logic: Cycle through the pool, prioritizing variety
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 3; s++) {
      const poolIdx = (d * 3 + s) % (pool.length || 1);
      const baseItem = pool[poolIdx] || {
          type: 'SHORT' as const,
          title: 'Topic Refinement',
          hook: 'Ready for deep dive',
          script: 'Focus on recent brand sentiment shifts.',
          metadata: { topic: 'General', hashtags: [], platforms: ['X'] }
      };

      const scheduledDate = new Date(start);
      scheduledDate.setDate(start.getDate() + d);
      
      // Fixed time-slots for optimal engagement
      // 09:00 (Morning scroll), 13:00 (Lunch), 19:00 (Evening peak)
      const hours = [9, 13, 19];
      scheduledDate.setHours(hours[s], 0, 0, 0);

      items.push({
        ...baseItem,
        id: `item_${d}_${s}`,
        scheduled_at: scheduledDate.toISOString(),
        status: 'PLANNED'
      });
    }
  }

  return {
    items,
    generated_at: new Date().toISOString(),
    brand: slate.brand
  };
}
