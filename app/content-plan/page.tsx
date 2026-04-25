import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Slate } from "@/lib/pipeline/types";
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
  
  // Group by day
  const dailyPlans = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toDateString();
    return {
        date,
        items: plan.items.filter(item => new Date(item.scheduled_at).toDateString() === dateStr)
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
            AI-optimized distribution for <span className="text-ink font-medium">{slate.brand.name}</span>. Scheduled across peak engagement windows.
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

      <footer className="mt-20 pt-8 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400 font-mono uppercase tracking-[0.2em]">
        <span>Total Production: {plan.items.length} Clips / Week</span>
        <span>Plan Generated: {new Date(plan.generated_at).toLocaleString()}</span>
      </footer>
    </main>
  );
}
