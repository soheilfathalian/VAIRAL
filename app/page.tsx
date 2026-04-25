import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Slate } from "@/lib/pipeline/types";
import { KNOWN_ALIASES } from "@/lib/peec/projects";
import { BrandPicker } from "./components/BrandPicker";
import Link from "next/link";


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
          Pick an underdog brand. Vairal pulls how AI engines talk about it (via Peec AI), then ships a week of UGC video production: long-form for citation, shorts for reach, channel pitches for compounding.
        </p>
      </div>
      <Link href="/content-plan" className="mb-1 font-mono text-xs uppercase tracking-widest text-neutral-400 hover:text-accent transition-colors flex items-center gap-2">
        View Content Plan
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </Link>
    </header>
  );
}

export default async function Home() {
  const slate = await loadSlate();

  return (
    <main className="min-h-screen px-8 py-16 max-w-5xl mx-auto">
      <Header />
      <BrandPicker projects={KNOWN_ALIASES} currentBrand={slate?.brand.name ?? ""} />

      {!slate ? (
        <div className="mt-12 rounded-xl border border-neutral-200 p-8">
          <p className="text-neutral-600">
            No slate yet. Pick a brand above, or run <code className="px-2 py-1 bg-neutral-100 rounded font-mono">npm run slate</code> in the terminal.
          </p>
        </div>
      ) : (
        <>
          <Insight slate={slate} />
          <LongForm slate={slate} />
          <Shorts slate={slate} />
          <Pitches slate={slate} />
          <Footer slate={slate} />
        </>
      )}
    </main>
  );
}

function Insight({ slate }: { slate: Slate }) {
  const i = slate.headline_insight;
  return (
    <section className="mt-10 rounded-2xl bg-ink text-paper p-8">
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">Headline insight · {slate.brand.name}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight">{i.headline}</h2>
      <p className="mt-3 text-neutral-300">{i.subhead}</p>
      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {i.evidence.map((e) => (
          <div key={e.metric}>
            <dt className="font-mono text-xs uppercase text-neutral-400">{e.metric}</dt>
            <dd className="mt-1 text-2xl font-semibold">{e.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LongForm({ slate }: { slate: Slate }) {
  const lf = slate.long_form;
  return (
    <section className="mt-10">
      <SectionTitle label="Track A · Long-form YouTube brief" topic={lf.topic} />
      <div className="mt-4 rounded-2xl border border-neutral-200 p-8 bg-white">
        <h3 className="text-2xl font-semibold">{lf.title}</h3>
        {lf.hook && (
          <p className="mt-4 text-neutral-700 italic border-l-2 border-accent pl-4">&ldquo;{lf.hook}&rdquo;</p>
        )}
        {lf.description && <p className="mt-4 text-neutral-700 leading-relaxed">{lf.description}</p>}
        {lf.chapters.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">Chapters (mapped to AI sub-queries)</p>
            <ol className="mt-3 space-y-3">
              {lf.chapters.map((c, i) => (
                <li key={i} className="border-l-2 border-neutral-200 pl-4">
                  <p className="font-mono text-sm text-neutral-500">{c.timestamp}</p>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">↳ from sub-query: <span className="font-mono">{c.sub_query_source}</span></p>
                  <ul className="mt-2 text-sm text-neutral-700 list-disc list-inside">
                    {c.talking_points.map((t, j) => <li key={j}>{t}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        )}
        {lf.b_roll.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">B-roll</p>
            <ul className="mt-2 text-sm text-neutral-700 list-disc list-inside">
              {lf.b_roll.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
        {lf.citation_targets.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">Existing cited videos in this space</p>
            <ul className="mt-2 text-sm space-y-1">
              {lf.citation_targets.map((c) => (
                <li key={c.url}>
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">{c.channel_title}</a>
                  <span className="text-neutral-500 ml-2">— {c.why}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Shorts({ slate }: { slate: Slate }) {
  if (slate.shorts.length === 0) {
    return (
      <section className="mt-10">
        <SectionTitle label="Track B · Shorts scripts" topic="3 hot takes targeting competitor wedges" />
        <p className="mt-4 text-neutral-500 text-sm">Awaiting Gemini generation.</p>
      </section>
    );
  }
  return (
    <section className="mt-10">
      <SectionTitle label="Track B · Shorts scripts" topic="3 hot takes targeting competitor wedges" />
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {slate.shorts.map((s, i) => (
          <article key={i} className="rounded-2xl border border-neutral-200 p-6 bg-white flex flex-col">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">vs {s.competitor_wedge.name}</p>
            <p className="mt-1 text-sm text-neutral-500">{s.competitor_wedge.weak_topic} · sentiment {s.competitor_wedge.sentiment}</p>
            <p className="mt-4 font-semibold">{s.hook}</p>
            <p className="mt-3 text-sm text-neutral-700">{s.claim}</p>
            <p className="mt-3 text-sm text-neutral-700">{s.payoff}</p>
            <div className="mt-4 flex flex-wrap gap-1">
              {s.hashtags.map((h, j) => <span key={j} className="text-xs text-accent">{h}</span>)}
            </div>
            
            <div className="mt-auto pt-6">
              <Link 
                href={`/teleprompter?script=${encodeURIComponent(`${s.hook} ${s.claim} ${s.payoff}`)}`}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink bg-paper border border-neutral-200 px-4 py-2 rounded-full hover:bg-neutral-100 transition-colors w-full justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Record Video
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pitches({ slate }: { slate: Slate }) {
  if (slate.pitches.length === 0) return null;
  return (
    <section className="mt-10">
      <SectionTitle label="Track C · Channel pitch list" topic="Top YouTube channels currently cited by AI engines" />
      <div className="mt-4 space-y-4">
        {slate.pitches.map((p) => (
          <article key={p.channel_title} className="rounded-2xl border border-neutral-200 p-6 bg-white">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-semibold">{p.channel_title}</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {p.why_it_matters.retrievals} retrievals · {p.why_it_matters.citation_count} citations · sample: <em>{p.why_it_matters.sample_video}</em>
                </p>
              </div>
            </div>
            {p.pitch_angle && <p className="mt-3 text-sm text-neutral-700"><strong>Angle:</strong> {p.pitch_angle}</p>}
            {p.email_subject && (
              <div className="mt-4 rounded-lg bg-neutral-50 p-4">
                <p className="font-mono text-xs text-neutral-500">SUBJECT</p>
                <p className="font-medium">{p.email_subject}</p>
                <p className="font-mono text-xs text-neutral-500 mt-3">BODY</p>
                <p className="text-sm whitespace-pre-wrap text-neutral-700">{p.email_body}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ label, topic }: { label: string; topic: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="text-neutral-700 mt-1">{topic}</p>
    </div>
  );
}

function Footer({ slate }: { slate: Slate }) {
  return (
    <footer className="mt-16 pt-8 border-t border-neutral-200 text-xs text-neutral-500 font-mono">
      Generated {new Date(slate.generated_at).toLocaleString()} · window {slate.date_range.start_date} → {slate.date_range.end_date} · project {slate.project_id}
    </footer>
  );
}
