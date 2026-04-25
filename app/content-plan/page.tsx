import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Slate } from "@/lib/pipeline/types";
import { generateSmartPlan } from "@/lib/pipeline/planner";
import Link from "next/link";

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
                <article key={item.id} className="group relative rounded-2xl border border-neutral-200 p-5 bg-white hover:border-accent hover:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)] transition-all flex flex-col h-56">
                  <div className="flex justify-between items-start">
                    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                      item.type === 'SHORT' ? 'bg-indigo-50 text-indigo-600' : 
                      item.type === 'LONG_FORM_CHAPTER' ? 'bg-amber-50 text-amber-600' : 
                      item.type === 'LONG_FORM_FULL' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-neutral-50 text-neutral-400'
                    }`}>
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-neutral-400">
                        {new Date(item.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xs font-semibold leading-relaxed text-ink group-hover:text-accent transition-colors line-clamp-3">
                    {item.title}
                  </h3>
                  
                  <div className="mt-2 flex gap-1">
                    {item.metadata.platforms.map(p => (
                        <span key={p} className="text-[7px] font-mono bg-neutral-50 text-neutral-400 px-1 rounded uppercase">{p.slice(0, 2)}</span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                    <Link 
                      href={`/teleprompter?script=${encodeURIComponent(item.script)}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider"
                    >
                      Record Take
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
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
