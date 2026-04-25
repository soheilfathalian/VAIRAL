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
      <div className="mt-2">
        <select
          disabled={generating !== null}
          onChange={(e) => {
            if (e.target.value) generate(e.target.value);
          }}
          value={currentBrand ? projects.find((p) => p.name === currentBrand)?.id ?? "" : ""}
          className="w-full max-w-sm px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-ink focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundPosition: "right 0.75rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1rem 1rem",
            paddingRight: "2.5rem"
          }}
        >
          <option value="" disabled>
            {generating ? "Generating..." : "Select a brand to generate slate..."}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
