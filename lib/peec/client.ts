import "dotenv/config";
import type {
  Brand, BrandReportRow, ChatContent, ChatSummary, DomainReportRow,
  FanoutQuery, Model, Project, Prompt, ReportRequest, Tag, Topic,
  UrlContent, UrlReportRow,
} from "./types.js";

const BASE = process.env.PEEC_BASE_URL ?? "https://api.peec.ai/customer/v1";
const KEY = process.env.PEEC_API_KEY;
if (!KEY) throw new Error("PEEC_API_KEY missing in .env");

type Envelope<T> = { data: T; totalCount?: number };

async function request<T>(path: string, opts: { method?: string; query?: Record<string, string | number | undefined>; body?: unknown } = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      "x-api-key": KEY!,
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Peec ${opts.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

const list = <T>(p: string, q?: Record<string, string | number | undefined>) =>
  request<Envelope<T[]>>(p, { query: q }).then((r) => r.data);
const post = <T>(p: string, projectId: string, body: unknown) =>
  request<Envelope<T[]>>(p, { method: "POST", query: { project_id: projectId }, body }).then((r) => r.data);

export const peec = {
  listProjects: () => list<Project>("/projects"),
  listBrands: (projectId: string) => list<Brand>("/brands", { project_id: projectId }),
  listTopics: (projectId: string) => list<Topic>("/topics", { project_id: projectId }),
  listTags: (projectId: string) => list<Tag>("/tags", { project_id: projectId }),
  listModels: (projectId: string) =>
    request<{ data: Model[] }>("/models", { query: { project_id: projectId } }).then((r) => r.data),
  listPrompts: (projectId: string, opts: { limit?: number; offset?: number; topic_id?: string; tag_id?: string } = {}) =>
    list<Prompt>("/prompts", { project_id: projectId, ...opts }),
  listChats: (projectId: string, range: { start_date: string; end_date: string; limit?: number; offset?: number; prompt_id?: string; model_id?: string }) =>
    list<ChatSummary>("/chats", { project_id: projectId, ...range }),
  getChat: (projectId: string, chatId: string) =>
    request<ChatContent>(`/chats/${chatId}/content`, { query: { project_id: projectId } }),
  brandReport: (projectId: string, body: ReportRequest) =>
    post<BrandReportRow>("/reports/brands", projectId, body),
  domainReport: (projectId: string, body: ReportRequest) =>
    post<DomainReportRow>("/reports/domains", projectId, body),
  urlReport: (projectId: string, body: ReportRequest) =>
    post<UrlReportRow>("/reports/urls", projectId, body),
  fanoutSearch: (projectId: string, body: ReportRequest & { prompt_id?: string; chat_id?: string; topic_id?: string }) =>
    post<FanoutQuery>("/queries/search", projectId, body),
  urlContent: (projectId: string, body: { url: string; max_length?: number }) =>
    request<UrlContent>("/sources/urls/content", { method: "POST", query: { project_id: projectId }, body }),
};

export const dateRange = (days = 30) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start_date: fmt(start), end_date: fmt(end) };
};
