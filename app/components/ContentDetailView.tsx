"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ContentItem } from "@/lib/pipeline/types";

// ── Platform icons ────────────────────────────────────────────────────────────
type Platform = ContentItem["metadata"]["platforms"][number];

function PlatformIcon({ platform }: { platform: Platform }) {
  switch (platform) {
    case "YOUTUBE":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#FF0000">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
        </svg>
      );
    case "TIKTOK":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#010101">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
      );
    case "INSTAGRAM":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth={1.8}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="#E1306C" stroke="none" />
        </svg>
      );
    case "X":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#000000">
          <path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9L1 2h7l4.8 6.4L18.2 2zm-1.2 18h1.9L7.1 4H5.1l11.9 16z" />
        </svg>
      );
    case "REDDIT":
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#FF4500">
          <path d="M22 11.5c0-1.4-1.1-2.5-2.5-2.5-.7 0-1.3.3-1.7.7-1.5-1.1-3.6-1.8-5.8-1.9l1-4.7 3.2.7c0 1.1.9 2 2 2 1.1 0 2-.9 2-2s-.9-2-2-2c-.8 0-1.5.4-1.8 1l-3.6-.8c-.1 0-.3 0-.4.1-.1.1-.1.3-.2.4l-1.1 5.3c-2.3.1-4.3.8-5.8 1.9-.4-.4-1-.7-1.7-.7-1.4 0-2.5 1.1-2.5 2.5 0 1 .5 1.8 1.3 2.2-.1.3-.1.6-.1 1 0 3.6 4.3 6.5 9.5 6.5s9.5-2.9 9.5-6.5c0-.3 0-.6-.1-1 .8-.4 1.3-1.2 1.3-2.2zM12 19.5c-2.4 0-4.4-1.2-4.9-2.8h9.8c-.5 1.6-2.5 2.8-4.9 2.8zm-2.8-5.4c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm5.6 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
        </svg>
      );
  }
}

// ── Hook variants ─────────────────────────────────────────────────────────────
function buildHookVariants(item: ContentItem): string[] {
  const base = item.hook;
  return [
    base,
    `${base}?`,
    `Here's why ${item.metadata.topic} changed everything — and most creators missed it.`,
    `Unpopular opinion: ${base.charAt(0).toLowerCase() + base.slice(1)}`,
    `They never talk about this side of ${item.metadata.topic}. Let's fix that.`,
  ];
}

// ── HookCarousel ─────────────────────────────────────────────────────────────
function HookCarousel({ hooks }: { hooks: string[] }) {
  const [idx, setIdx] = useState(0);

  const prev = useCallback(() => setIdx((i) => (i - 1 + hooks.length) % hooks.length), [hooks.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % hooks.length), [hooks.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
        Hook · {idx + 1}/{hooks.length}
      </p>

      <div className="mt-3 flex items-start gap-3">
        <button
          id="hook-prev"
          onClick={prev}
          aria-label="Previous hook"
          className="mt-0.5 text-neutral-300 hover:text-neutral-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <p className="flex-1 text-sm font-medium leading-relaxed text-neutral-700 italic border-l-2 border-accent pl-4">
          &ldquo;{hooks[idx]}&rdquo;
        </p>

        <button
          id="hook-next"
          onClick={next}
          aria-label="Next hook"
          className="mt-0.5 text-neutral-300 hover:text-neutral-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── ContentDetailModal ────────────────────────────────────────────────────────
export function ContentDetailModal({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const hooks = buildHookVariants(item);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const typeLabel: Record<ContentItem["type"], string> = {
    SHORT: "Short",
    PITCH_PROMO: "Pitch",
    REMIX: "Remix",
    REDDIT_POST: "Reddit AMA",
  };

  const scheduled = new Date(item.scheduled_at);

  return (
    <div
      id="content-detail-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />

      {/* Panel — matches the existing card/section style */}
      <article
        id="content-detail-panel"
        className="relative z-10 w-full sm:max-w-xl max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl border border-neutral-200 shadow-xl"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              {typeLabel[item.type]}
            </span>
            <span className="text-neutral-200">·</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              {scheduled.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
              {scheduled.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </span>
          </div>
          <button
            id="content-detail-close"
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-300 hover:text-neutral-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-7 py-6 space-y-7">
          {/* Title */}
          <h2 className="text-xl font-semibold leading-snug text-ink">{item.title}</h2>

          {/* Hook carousel */}
          <HookCarousel hooks={hooks} />

          {/* Script */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">Script</p>
            <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">{item.script}</p>
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-2">
            {item.metadata.platforms.map((p) => (
              <PlatformIcon key={p} platform={p} />
            ))}
          </div>

          {/* Hashtags */}
          {item.metadata.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {item.metadata.hashtags.map((h) => (
                <span key={h} className="text-xs text-accent">{h}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1 pb-1">
            <Link
              href={`/teleprompter?script=${encodeURIComponent(item.script)}`}
              id="content-detail-record"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink border border-neutral-200 px-4 py-2.5 rounded-full hover:border-ink transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Record Take
            </Link>
            <button
              id="content-detail-copy"
              onClick={() => navigator.clipboard.writeText(item.script)}
              className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Copy Script
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

// ── ContentCard ───────────────────────────────────────────────────────────────
export function ContentCard({ item }: { item: ContentItem }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  // Persist done state per item across page refreshes
  useEffect(() => {
    const stored = localStorage.getItem(`done:${item.id}`);
    if (stored === "1") setDone(true);
  }, [item.id]);

  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !done;
    setDone(next);
    localStorage.setItem(`done:${item.id}`, next ? "1" : "0");
  };

  const typeColors: Record<ContentItem["type"], string> = {
    SHORT: "bg-indigo-50 text-indigo-600",
    PITCH_PROMO: "bg-neutral-50 text-neutral-400",
    REMIX: "bg-fuchsia-50 text-fuchsia-600",
    REDDIT_POST: "bg-orange-50 text-orange-600",
  };

  return (
    <>
      <article
        id={`content-card-${item.id}`}
        className={`group relative rounded-2xl border p-5 bg-white transition-all flex flex-col h-56 ${
          done
            ? "border-neutral-100 opacity-50"
            : "border-neutral-200 hover:border-accent hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)]"
        }`}
      >
        <div className="flex justify-between items-start">
          <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md ${typeColors[item.type]}`}>
            {item.type.replace(/_/g, " ")}
          </span>

          {/* Done checkmark */}
          <button
            id={`content-card-done-${item.id}`}
            onClick={toggleDone}
            aria-label={done ? "Mark as not done" : "Mark as done"}
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
              done
                ? "border-emerald-400 bg-emerald-400"
                : "border-neutral-300 hover:border-neutral-500"
            }`}
          >
            {done && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Clickable title */}
        <button
          id={`content-card-title-${item.id}`}
          onClick={() => setOpen(true)}
          className={`mt-4 text-left text-xs font-semibold leading-relaxed transition-colors line-clamp-3 hover:underline underline-offset-2 ${
            done ? "line-through text-neutral-400" : "text-ink group-hover:text-accent"
          }`}
        >
          {item.title}
        </button>

        <div className="mt-2 flex items-center gap-2">
          {item.metadata.platforms.map((p) => (
            <PlatformIcon key={p} platform={p} />
          ))}
        </div>

        {item.metadata.is_low_sentiment && (
          <div className="mt-3">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Combat Low Sentiment
            </span>
          </div>
        )}

        {!done && (
          <div className="mt-auto pt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
            <Link
              href={`/teleprompter?script=${encodeURIComponent(item.script)}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider"
            >
              Record Take
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </article>

      {open && <ContentDetailModal item={item} onClose={() => setOpen(false)} />}
    </>
  );
}
