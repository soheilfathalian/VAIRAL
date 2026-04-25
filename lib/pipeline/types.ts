export type Insight = {
  headline: string;
  subhead: string;
  evidence: { metric: string; value: string }[];
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
};

export type ChannelPitch = {
  channel_title: string;
  channel_url: string;
  why_it_matters: { retrievals: number; citation_count: number; sample_video: string };
  pitch_angle: string;
  email_subject: string;
  email_body: string;
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
  long_form: LongFormBrief;
  shorts: ShortScript[];
  pitches: ChannelPitch[];
  replay?: ReplayValidation;
};
