"use client";

import { useState } from "react";
import type { ChannelPitch } from "@/lib/pipeline/types";

export function PitchCard({ pitch, rank }: { pitch: ChannelPitch; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  const mailtoBody = encodeURIComponent(pitch.email_body);
  const mailtoSubject = encodeURIComponent(pitch.email_subject);
  const mailto = `mailto:?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:border-accent hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.12)] transition-all">
      {/* Main row — always visible */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: channel identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF0000">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink">{pitch.channel_title}</h3>
                <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-300">#{rank}</span>
              </div>
              <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                {pitch.why_it_matters.retrievals} retrievals · {pitch.why_it_matters.citation_count} citations ·{" "}
                {pitch.why_it_matters.retrievals + pitch.why_it_matters.citation_count} signals
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={mailto}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white bg-ink px-4 py-2 rounded-full hover:bg-accent transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Open in Mail
            </a>
          </div>
        </div>

        {/* Summary — always visible below the header */}
        {pitch.pitch_angle && (
          <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
            <span className="font-semibold text-ink">Why reach out: </span>{pitch.pitch_angle}
          </p>
        )}

        {/* Reference video pill */}
        <div className="mt-3 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-[10px] font-mono text-neutral-400 truncate">
            cited: <em>{pitch.why_it_matters.sample_video}</em>
          </span>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-accent transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Hide email draft" : "Preview email draft"}
        </button>
      </div>

      {/* Collapsible email body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-6 pb-6">
          <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Subject</span>
              <span className="text-xs font-semibold text-ink">{pitch.email_subject}</span>
            </div>
            <div className="h-px bg-neutral-200 mb-3" />
            <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{pitch.email_body}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
