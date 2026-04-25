export type Project = { id: string; name: string; status: string };

export type Brand = {
  id: string;
  name: string;
  domains: string[];
  is_own: boolean;
  color?: string;
  aliases?: string[];
};

export type Topic = { id: string; name: string };
export type Tag = { id: string; name: string; color?: string };

export type Model = { id: string; name: string; is_active: boolean };

export type Prompt = {
  id: string;
  messages: { content: string }[];
  tags: { id: string }[];
  topic: { id: string };
  user_location: { country: string };
  volume: number;
};

export type ChatSummary = {
  id: string;
  prompt: { id: string };
  model: { id: string };
  model_channel: { id: string };
  date: string;
};

export type ChatSource = {
  url: string;
  urlNormalized: string;
  domain: string;
  citationCount: number;
  citationPosition: number;
};

export type ChatContent = {
  id: string;
  prompt: { id: string };
  model: { id: string };
  model_channel: { id: string };
  sources: ChatSource[];
  brands_mentioned: { id: string; name: string; position: number }[];
  messages: { role: "user" | "assistant"; content: string }[];
  queries: unknown[];
  products: unknown[];
};

export type BrandReportRow = {
  brand: { id: string; name: string };
  share_of_voice: number;
  mention_count: number;
  visibility: number;
  visibility_count: number;
  visibility_total: number;
  sentiment: number;
  sentiment_sum: number;
  sentiment_count: number;
  position: number;
  position_sum: number;
  position_count: number;
};

export type DomainReportRow = {
  domain: string;
  classification: string;
  usage_rate: number;
  citation_avg: number;
  retrieved_percentage: number;
  retrieval_rate: number;
  citation_rate: number;
  retrieval_count: number;
  citation_count: number;
  mentioned_brands: { id: string }[];
};

export type UrlReportRow = {
  url: string;
  classification: string;
  title: string;
  channel_title: string | null;
  usage_count: number;
  citation_count: number;
  citation_avg: number;
  retrievals: number;
  retrieval_count: number;
  citation_rate: number;
  mentioned_brands: { id: string }[];
};

export type FanoutQuery = {
  prompt: { id: string };
  chat: { id: string };
  model: { id: string };
  model_channel: { id: string };
  date: string;
  query: { index: number; text: string };
};

export type UrlContent = {
  url: string;
  title?: string;
  domain?: string;
  channel_title?: string | null;
  classification?: string;
  url_classification?: string;
  content: string;
  content_length: number;
  truncated: boolean;
  content_updated_at?: string;
};

export type DateRange = { start_date: string; end_date: string };

export type ReportRequest = DateRange & {
  limit?: number;
  offset?: number;
  dimensions?: string[];
  filters?: Record<string, unknown>;
};
