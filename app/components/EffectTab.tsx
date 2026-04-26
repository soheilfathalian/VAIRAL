"use client";

import { useState, useEffect } from "react";
import type { ContentItem } from "@/lib/pipeline/types";

// ── Types ────────────────────────────────────────────────────────────────────

type StoredPromptData = {
  promptId: string;
  postedAt: string;
  item: ContentItem;
  projectId: string;
  brandId: string;
};

type ImpactData = {
  chatCount: number;
  ownBrand: {
    visibility: number;
    sentiment: number;
    position: number;
    share_of_voice: number;
  } | null;
};

type PostedVideo = StoredPromptData & {
  impact?: ImpactData;
  loading: boolean;
  error?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function impactScore(impact?: ImpactData): number {
  if (!impact) return 0;
  const vis = impact.ownBrand?.visibility ?? 0;
  const chats = impact.chatCount ?? 0;
  return Math.round(vis * 100 * Math.log1p(chats));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ImpactBar({ pct }: { pct: number }) {
  const color =
    pct >= 60 ? "#22c55e" : pct >= 30 ? "#f59e0b" : "#6366f1";
  return (
    <div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <span className={`text-xs font-bold font-mono ${color ?? "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  SHORT: "bg-indigo-50 text-indigo-600",
  PITCH_PROMO: "bg-neutral-50 text-neutral-400",
  REMIX: "bg-fuchsia-50 text-fuchsia-600",
  REDDIT_POST: "bg-orange-50 text-orange-600",
};

function VideoImpactCard({
  video,
  rank,
  maxScore,
}: {
  video: PostedVideo;
  rank: number;
  maxScore: number;
}) {
  const score = impactScore(video.impact);
  const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  const hasData =
    !video.loading &&
    !video.error &&
    video.impact &&
    (video.impact.chatCount > 0 || video.impact.ownBrand !== null);

  const promptText = `What is the latest on ${video.item.metadata.topic}? Is it true that ${video.item.hook}?`;

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5 flex flex-col sm:flex-row gap-5">
        {/* ── Left: Content Info ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold text-neutral-300">
              #{rank}
            </span>
            <span
              className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                TYPE_COLORS[video.item.type] ?? "bg-neutral-50 text-neutral-400"
              }`}
            >
              {video.item.type.replace(/_/g, " ")}
            </span>

            {/* "Posted X ago" pill */}
            <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-full">
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Posted {timeAgo(video.postedAt)}
            </span>
          </div>

          {/* Title & hook */}
          <div>
            <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2">
              {video.item.title}
            </h3>
            <p className="mt-1 text-[11px] text-neutral-400 italic line-clamp-1">
              &ldquo;{video.item.hook}&rdquo;
            </p>
          </div>

          {/* Tracked prompt */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
              Tracked Peec Prompt
            </p>
            <p className="text-[11px] text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100 line-clamp-2 leading-relaxed">
              {promptText}
            </p>
          </div>

          {/* Impact bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                Impact
              </span>
              <span className="text-[9px] font-mono text-neutral-400">{score} pts</span>
            </div>
            <ImpactBar pct={pct} />
          </div>
        </div>

        {/* ── Right: Metrics Panel ── */}
        <div className="shrink-0 w-full sm:w-48 bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex flex-col justify-center">
          {video.loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-6 bg-neutral-200 rounded animate-pulse"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
          ) : video.error ? (
            <p className="text-[10px] text-neutral-400 italic text-center">
              Could not load data
            </p>
          ) : !hasData ? (
            <div className="text-center py-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-white border border-neutral-200 flex items-center justify-center mb-3 shadow-sm">
                <svg
                  className="w-5 h-5 text-neutral-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
                  />
                </svg>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Awaiting data
              </p>
              <p className="text-[9px] text-neutral-300 mt-1 leading-relaxed">
                Peec needs a few days to scrape AI responses
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Metric
                label="AI Visibility"
                value={
                  video.impact?.ownBrand?.visibility != null
                    ? `${(video.impact.ownBrand.visibility * 100).toFixed(1)}%`
                    : "—"
                }
                color={
                  (video.impact?.ownBrand?.visibility ?? 0) > 0.3
                    ? "text-emerald-600"
                    : "text-amber-500"
                }
              />
              <Metric
                label="Prompt Runs"
                value={String(video.impact?.chatCount ?? 0)}
                color="text-indigo-600"
              />
              <Metric
                label="Sentiment"
                value={
                  video.impact?.ownBrand?.sentiment != null
                    ? `${Math.round(video.impact.ownBrand.sentiment)}/100`
                    : "—"
                }
                color={
                  (video.impact?.ownBrand?.sentiment ?? 0) > 60
                    ? "text-emerald-600"
                    : "text-red-500"
                }
              />
              <Metric
                label="AI Position"
                value={
                  video.impact?.ownBrand?.position != null
                    ? `#${video.impact.ownBrand.position.toFixed(1)}`
                    : "—"
                }
                color="text-neutral-600"
              />

              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                  Impact Score
                </span>
                <span className="text-base font-bold text-ink">{score}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Main EffectTab ────────────────────────────────────────────────────────────

export function EffectTab({
  projectId,
  brandId,
}: {
  projectId: string;
  brandId: string;
}) {
  const [videos, setVideos] = useState<PostedVideo[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored: PostedVideo[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("prompt_data:")) continue;
      try {
        const data: StoredPromptData = JSON.parse(localStorage.getItem(key)!);
        stored.push({ ...data, loading: true });
      } catch {
        // malformed entry — skip
      }
    }

    // Most recent first
    stored.sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );

    setVideos(stored);
    setMounted(true);

    // Fetch impact for each
    stored.forEach((video, idx) => {
      const pid = video.projectId || projectId;
      const bid = video.brandId || brandId;
      fetch(
        `/api/effect?projectId=${encodeURIComponent(pid)}&promptId=${encodeURIComponent(video.promptId)}&brandId=${encodeURIComponent(bid)}`
      )
        .then((r) => r.json())
        .then((data: ImpactData & { error?: string }) => {
          setVideos((prev) =>
            prev.map((v, i) =>
              i === idx
                ? { ...v, loading: false, impact: data }
                : v
            )
          );
        })
        .catch(() => {
          setVideos((prev) =>
            prev.map((v, i) =>
              i === idx ? { ...v, loading: false, error: "fetch failed" } : v
            )
          );
        });
    });
  }, [projectId, brandId]);

  if (!mounted) return null;

  // Sort by impact score descending (once data loads)
  const sorted = [...videos].sort(
    (a, b) => impactScore(b.impact) - impactScore(a.impact)
  );
  const maxScore = Math.max(1, ...sorted.map((v) => impactScore(v.impact)));

  return (
    <section className="mt-16">
      {/* Section header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold">
            📈 Impact Tracking
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">
            Effect of Posted Videos
          </h2>
          <p className="mt-1 text-sm text-neutral-500 max-w-2xl">
            Each video you check off gets a Peec prompt attached to it. As AI
            engines get scraped over the coming days, you&apos;ll see whether
            your content is moving the needle on visibility and sentiment.
          </p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 shrink-0">
          {videos.length} video{videos.length !== 1 ? "s" : ""} tracked
        </span>
      </div>

      {/* Empty state */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/40 p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-4 shadow-sm">
            <svg
              className="w-7 h-7 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-neutral-500">
            No videos tracked yet
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Check off a content card in the calendar above once you&apos;ve posted
            it. Vairal will track its AI impact here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((video, i) => (
            <VideoImpactCard
              key={video.promptId}
              video={video}
              rank={i + 1}
              maxScore={maxScore}
            />
          ))}
        </div>
      )}
    </section>
  );
}
