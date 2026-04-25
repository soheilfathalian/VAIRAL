export type Insight = {
  headline: string;
  subhead: string;
  evidence: { metric: string; value: string }[];
};

export type SourceGap = {
  domain: string;
  classification: string;
  retrieved_percentage: number; // % of AI chats that retrieved this domain
  retrieval_rate: number;       // avg URLs retrieved per chat
  citation_rate: number;        // citations per retrieval
  competitors_present: string[]; // tracked competitor names found there
  gap_score: number;            // retrieved_percentage × citation_rate × competitor_count
  recommended_action: string;   // e.g. "PR / journalist pitch"
  content_format: string;       // e.g. "Press release, product loan"
};

export type GapAnalysis = {
  gaps: SourceGap[];
  total_gaps_found: number;
  summary: string;
};

export type LongFormBrief = {
  topic: string;
  topic_id: string;
  title: string;
  hook: string;
  description: string;
  chapters: { timestamp: string; title: string; sub_query_source: string; talking_points: string[] }[];
  b_roll: string[];
  thumbnail_concept: string;
  tags: string[];
  target_prompts: { id: string; text: string }[];
  citation_targets: { url: string; channel_title: string | null; why: string }[];
};

export type ShortScript = {
  topic: string;
  competitor_wedge: { name: string; sentiment: number; weak_topic: string };
  hook: string;
  claim: string;
  payoff: string;
  on_screen_text: string[];
  hashtags: string[];
  shot_list: string[];
  fresh_news_anchor?: { title: string; url: string; snippet: string; date: string } | null;
};

export type RemixScript = {
  source_url: string;
  hook: string;
  remix_angle: string;
  script: string;
  format: string;
};

export type ChannelPitch = {
  channel_title: string;
  channel_url: string;
  why_it_matters: { retrievals: number; citation_count: number; sample_video: string };
  pitch_angle: string;
  email_subject: string;
  email_body: string;
};

export type QnaCluster = {
  items: {
    reddit_post: { title: string; body: string };
    short_react_1: { hook: string; script: string };
    short_react_2: { hook: string; script: string };
  };
};

export type ReplayValidation = {
  existing_url: string;
  existing_title: string;
  existing_channel: string | null;
  existing_metrics: { retrievals: number; citations: number };
  generated_brief: LongFormBrief;
  similarity_notes: string[];
};

export type Slate = {
  generated_at: string;
  brand: { id: string; name: string };
  project_id: string;
  date_range: { start_date: string; end_date: string };
  headline_insight: Insight;
  shorts: ShortScript[];
  remixes: RemixScript[];
  pitches: ChannelPitch[];
  gap_analysis: GapAnalysis;
  qna_clusters: QnaCluster[];
  low_sentiment_shorts: ShortScript[];
  replay?: ReplayValidation;
};

export type ContentItem = {
  id: string;
  type: 'SHORT' | 'PITCH_PROMO' | 'REMIX' | 'REDDIT_POST';
  title: string;
  hook: string;
  script: string;
  scheduled_at: string; // ISO date
  status: 'PLANNED' | 'RECORDED' | 'PUBLISHED';
  metadata: {
    topic: string;
    hashtags: string[];
    platforms: Array<'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'X' | 'REDDIT'>;
    is_urgent?: boolean;
    is_low_sentiment?: boolean;
  };
};

export type WeeklyContentPlan = {
  items: ContentItem[];
  generated_at: string;
  brand: { id: string; name: string };
};
