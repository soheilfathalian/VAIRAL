"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = { alias: string; id: string; label: string };

export function BrandPicker({ projects, currentBrand }: { projects: Project[]; currentBrand: string }) {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(alias: string) {
    setGenerating(alias);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: alias }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 mr-2">Generate for</span>
      {projects.map((p) => {
        const isCurrent = p.label === currentBrand;
        const isLoading = generating === p.alias;
        return (
          <button
            key={p.alias}
            onClick={() => generate(p.alias)}
            disabled={generating !== null}
            className={`px-4 py-2 rounded-full text-sm font-medium transition border
              ${isCurrent ? "bg-ink text-paper border-ink" : "bg-white text-ink border-neutral-300 hover:border-ink"}
              ${generating !== null ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isLoading ? `${p.label} · generating…` : p.label}
          </button>
        );
      })}
      {error && <span className="text-sm text-red-600 ml-3">{error}</span>}
    </div>
  );
}
