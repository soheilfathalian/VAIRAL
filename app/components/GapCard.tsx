import type { SourceGap } from "@/lib/pipeline/types";

const CLASSIFICATION_COLOR: Record<string, { bg: string; text: string }> = {
  UGC:          { bg: "bg-violet-50",  text: "text-violet-600"  },
  EDITORIAL:    { bg: "bg-blue-50",    text: "text-blue-600"    },
  CORPORATE:    { bg: "bg-amber-50",   text: "text-amber-600"   },
  REFERENCE:    { bg: "bg-emerald-50", text: "text-emerald-600" },
  INSTITUTIONAL:{ bg: "bg-rose-50",   text: "text-rose-600"    },
  OTHER:        { bg: "bg-neutral-50", text: "text-neutral-500" },
};

function classColors(c: string) {
  return CLASSIFICATION_COLOR[(c ?? "").toUpperCase()] ?? CLASSIFICATION_COLOR["OTHER"];
}

function UrgencyBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const color = pct > 66 ? "bg-red-500" : pct > 33 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-neutral-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[9px] text-neutral-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

export function GapCard({ gap, max, rank }: { gap: SourceGap; max: number; rank: number }) {
  const colors = classColors(gap.classification);
  const pct = max > 0 ? Math.round((gap.gap_score / max) * 100) : 0;
  const urgency = pct > 66 ? "High" : pct > 33 ? "Medium" : "Low";
  const urgencyColor = pct > 66 ? "text-red-500" : pct > 33 ? "text-amber-500" : "text-emerald-500";

  const mailtoSubject = encodeURIComponent(`Partnership Request: ${gap.domain}`);
  const mailtoBody = encodeURIComponent(
    `Hi team,\n\nWe noticed that ${gap.domain} frequently covers our competitors (${gap.competitors_present.join(", ")}) but we haven't had a chance to connect yet.\n\nWe'd love to explore how we can work together (${gap.recommended_action.toLowerCase()}).\n\nLet me know if you have time for a quick chat next week.\n\nBest,`
  );
  const mailto = `mailto:?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-6 hover:border-accent hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.12)] transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Left: domain identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink font-mono">{gap.domain}</h3>
              <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-300">#{rank}</span>
              <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
                {gap.classification}
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
              {gap.retrieved_percentage}% of AI chats · {gap.citation_rate.toFixed(1)}× citation rate
            </p>
          </div>
        </div>

        {/* Right: pitch button only */}
        <a
          href={mailto}
          className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white bg-ink px-5 py-2 rounded-full hover:bg-accent transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Pitch Domain
        </a>
      </div>

      {/* Recommended action */}
      <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
        <span className="font-semibold text-ink">Action: </span>{gap.recommended_action}
        <span className="text-neutral-300 mx-2">·</span>
        <span className="text-neutral-500 italic text-xs">{gap.content_format}</span>
      </p>

      {/* Competitors + urgency bar on the same row */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mr-1">Competitors:</span>
        {gap.competitors_present.map((c) => (
          <span key={c} className="text-[9px] font-mono bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md border border-red-100">
            {c}
          </span>
        ))}
        <span className="text-neutral-200 mx-1">·</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Priority:</span>
        <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${urgencyColor}`}>{urgency}</span>
        <div className="w-20">
          <UrgencyBar score={gap.gap_score} max={max} />
        </div>
      </div>
    </article>
  );
}
