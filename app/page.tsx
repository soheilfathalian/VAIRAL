import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Slate, SourceGap } from "@/lib/pipeline/types";
import { BrandPicker } from "./components/BrandPicker";
import { generateSmartPlan } from "@/lib/pipeline/planner";
import { ContentCard } from "./components/ContentDetailView";
import { PitchCard } from "./components/PitchCard";
import { GapCard } from "./components/GapCard";

async function loadSlate(): Promise<Slate | null> {
  try {
    const raw = await readFile(join(process.cwd(), "data/slate/latest.json"), "utf8");
    return JSON.parse(raw) as Slate;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";


function Header() {
  return (
    <header className="flex justify-between items-end">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Vairal</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">Founder channel engine</h1>
        <p className="mt-3 text-lg text-neutral-600 max-w-2xl">
          Pick an underdog brand. Vairal reads how AI search is talking about it right now, then drafts the week of content that earns more of those mentions.
        </p>
      </div>
    </header>
  );
}

export default async function Home() {
  const slate = await loadSlate();

  let plan: any;
  let gaps: SourceGap[] = [];
  let maxGapScore = 0;
  let dailyPlans: { date: Date; items: any[] }[] = [];

  if (slate) {
    plan = generateSmartPlan(slate);
    gaps = slate.gap_analysis?.gaps ?? [];
    maxGapScore = gaps.reduce((m, g) => Math.max(m, g.gap_score), 0);

    dailyPlans = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toDateString();
      return {
        date,
        items: plan!.items.filter((item: any) => new Date(item.scheduled_at).toDateString() === dateStr),
      };
    });
  }

  return (
    <main className="min-h-screen px-8 py-16 max-w-7xl mx-auto">
      <Header />
      <BrandPicker currentBrand={slate?.brand.name ?? ""} />

      {!slate ? (
        <div className="mt-12 rounded-xl border border-neutral-200 p-8">
          <p className="text-neutral-600">
            Pick a brand above and Vairal will draft a week of content in about a minute. (Or run <code className="px-2 py-1 bg-neutral-100 rounded font-mono">npm run slate</code> from the terminal.)
          </p>
        </div>
      ) : (
        <>


          <section className="mt-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">📅 Weekly Schedule</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">Content Calendar</h2>
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

          {gaps.length > 0 && (
            <section className="mt-16">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold">🔴 Source Gaps</p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink">
                    {gaps.length} high-trust domains — competitors cited, you&apos;re not
                  </h2>
                  {slate.gap_analysis?.summary && (
                    <p className="mt-1 text-sm text-neutral-500 max-w-2xl">{slate.gap_analysis.summary}</p>
                  )}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 shrink-0">
                  {slate.gap_analysis?.total_gaps_found ?? gaps.length} total gaps · showing top {gaps.length}
                </span>
              </div>
              <div className="space-y-4">
                {gaps.map((gap, i) => (
                  <GapCard key={gap.domain} gap={gap} max={maxGapScore} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {slate.pitches && slate.pitches.length > 0 && (
            <section className="mt-16">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">✉️ Creator Outreach</p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink">YouTube Channel Pitches</h2>
                  <p className="mt-1 text-sm text-neutral-500">Top channels currently cited by AI engines — ranked by retrievals + citations.</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 shrink-0">
                  {slate.pitches.length} channel{slate.pitches.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-4">
                {slate.pitches.map((pitch, i) => (
                  <PitchCard key={pitch.channel_title} pitch={pitch} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          <footer className="mt-20 pt-8 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400 font-mono uppercase tracking-[0.2em]">
            <span>{plan!.items.length} clips queued this week</span>
            <span>drafted {new Date(plan!.generated_at).toLocaleString()}</span>
          </footer>
        </>
      )}
    </main>
  );
}
