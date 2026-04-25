import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Slate, SourceGap } from "@/lib/pipeline/types";
import { generateSmartPlan } from "@/lib/pipeline/planner";
import Link from "next/link";
import { ContentCard } from "../components/ContentDetailView";

async function loadSlate(): Promise<Slate | null> {
  try {
    const raw = await readFile(join(process.cwd(), "data/slate/latest.json"), "utf8");
    return JSON.parse(raw) as Slate;
  } catch {
    return null;
  }
}

const CLASSIFICATION_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  UGC:          { bg: "bg-violet-50",  text: "text-violet-600",  dot: "bg-violet-500" },
  EDITORIAL:    { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-500"   },
  CORPORATE:    { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-500"  },
  REFERENCE:    { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500"},
  INSTITUTIONAL:{ bg: "bg-rose-50",   text: "text-rose-600",    dot: "bg-rose-500"   },
  OTHER:        { bg: "bg-neutral-50", text: "text-neutral-500", dot: "bg-neutral-400"},
};

function classColors(classification: string) {
  return CLASSIFICATION_COLOR[(classification ?? "").toUpperCase()] ?? CLASSIFICATION_COLOR["OTHER"];
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

function GapCard({ gap, max }: { gap: SourceGap; max: number }) {
  const colors = classColors(gap.classification);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-3 hover:border-accent hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.15)] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-bold text-ink truncate">{gap.domain}</p>
          <p className="mt-0.5 text-[10px] text-neutral-400 font-mono">
            {gap.retrieved_percentage}% of AI chats · {gap.citation_rate.toFixed(1)}× citation rate
          </p>
        </div>
        <span className={`shrink-0 text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md ${colors.bg} ${colors.text}`}>
          {gap.classification}
        </span>
      </div>

      {/* Urgency bar */}
      <UrgencyBar score={gap.gap_score} max={max} />

      {/* Competitors present */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Competitors here</p>
        <div className="flex flex-wrap gap-1">
          {gap.competitors_present.map((c) => (
            <span key={c} className="text-[9px] font-mono bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md border border-red-100">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended action */}
      <div className="pt-2 border-t border-neutral-100">
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Recommended action</p>
        <p className="text-[11px] text-ink font-medium leading-snug">{gap.recommended_action}</p>
        <p className="mt-0.5 text-[10px] text-neutral-400">{gap.content_format}</p>
      </div>
    </div>
  );
}

export default async function ContentPlanPage() {
  const slate = await loadSlate();

  if (!slate) {
    return (
      <main className="min-h-screen flex items-center justify-center font-mono text-neutral-400">
        No slate data found. Generate a slate first.
      </main>
    );
  }

  const plan = generateSmartPlan(slate);
  const gaps = slate.gap_analysis?.gaps ?? [];
  const maxGapScore = gaps.reduce((m, g) => Math.max(m, g.gap_score), 0);

  // Group by day
  const dailyPlans = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toDateString();
    return {
      date,
      items: plan.items.filter(item => new Date(item.scheduled_at).toDateString() === dateStr),
    };
  });

  return (
    <main className="min-h-screen px-8 py-16 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-accent transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-ink">Smart Plan</h1>
          <p className="mt-4 text-lg text-neutral-500 max-w-xl">
            AI-optimised distribution for <span className="text-ink font-medium">{slate.brand.name}</span>. Scheduled across peak engagement windows.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-white border border-neutral-200 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-ink">
              {dailyPlans[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {dailyPlans[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Algorithm: Vairal v1.0 Smart Distro</p>
        </div>
      </header>

      {/* ── SOURCE GAP ANALYSIS ── */}
      {gaps.length > 0 && (
        <section className="mb-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold">🔴 Source Gaps</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">
                {gaps.length} high-trust domains — competitors cited, you&apos;re not
              </h2>
              {slate.gap_analysis?.summary && (
                <p className="mt-2 text-sm text-neutral-500 max-w-2xl">{slate.gap_analysis.summary}</p>
              )}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 shrink-0">
              {slate.gap_analysis?.total_gaps_found ?? gaps.length} total gaps · showing top {gaps.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {gaps.map((gap) => (
              <GapCard key={gap.domain} gap={gap} max={maxGapScore} />
            ))}
          </div>
        </section>
      )}

      {/* ── WEEKLY CALENDAR ── */}
      <section>
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">📅 Weekly Schedule</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">Content Calendar</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6">
          {dailyPlans.map((dayPlan, i) => (
            <section key={i} className="flex flex-col gap-6">
              <div className="flex flex-col items-center py-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                  {dayPlan.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="mt-1 text-2xl font-bold text-ink">{dayPlan.date.getDate()}</p>
              </div>

              <div className="space-y-4">
                {dayPlan.items.map((item) => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <footer className="mt-20 pt-8 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400 font-mono uppercase tracking-[0.2em]">
        <span>Total Production: {plan.items.length} Clips / Week</span>
        <span>Plan Generated: {new Date(plan.generated_at).toLocaleString()}</span>
      </footer>
    </main>
  );
}
