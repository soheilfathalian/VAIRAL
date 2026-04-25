"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProjectInfo = { id: string; name: string; status: string };

export function BrandPicker({ currentBrand }: { currentBrand: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectInfo[] | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setProjects(data.projects ?? []);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, []);

  async function generate(projectId: string) {
    setGenerating(projectId);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: projectId }),
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

  if (!projects) {
    return (
      <div className="mt-8 text-sm text-neutral-500 font-mono">Loading projects from Peec…</div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mt-8 text-sm text-neutral-500">
        No Peec projects accessible to this API key. Create one in the Peec dashboard.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          Generate slate for ({projects.length} projects available)
        </span>
        {error && <span className="text-sm text-red-600">⚠ {error}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => {
          const isCurrent = p.name === currentBrand;
          const isLoading = generating === p.id;
          const anyLoading = generating !== null;
          return (
            <button
              key={p.id}
              onClick={() => generate(p.id)}
              disabled={anyLoading}
              title={p.id}
              className={`px-3 py-1.5 rounded-full text-sm transition border whitespace-nowrap
                ${isCurrent ? "bg-ink text-paper border-ink" : "bg-white text-ink border-neutral-300 hover:border-ink"}
                ${anyLoading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {isLoading ? `${p.name} · generating…` : p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
