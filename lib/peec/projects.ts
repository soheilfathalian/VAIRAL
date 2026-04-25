import "dotenv/config";
import { peec } from "./client";

export type ProjectInfo = { id: string; name: string; status: string };

let _cache: { at: number; projects: ProjectInfo[] } | null = null;
const TTL_MS = 60_000;

export async function listProjects(): Promise<ProjectInfo[]> {
  if (_cache && Date.now() - _cache.at < TTL_MS) return _cache.projects;
  const projects = await peec.listProjects();
  _cache = { at: Date.now(), projects };
  return projects;
}

export async function resolveProject(input: string | undefined): Promise<ProjectInfo> {
  const projects = await listProjects();
  if (!input) {
    if (projects.length === 0) throw new Error("No Peec projects accessible to this API key");
    return projects[0];
  }

  if (input.startsWith("or_")) {
    const exact = projects.find((p) => p.id === input);
    if (exact) return exact;
    return { id: input, name: input, status: "UNKNOWN" };
  }

  const normalised = input.toLowerCase().trim();
  const match =
    projects.find((p) => p.name.toLowerCase() === normalised) ??
    projects.find((p) => p.name.toLowerCase().includes(normalised));
  if (match) return match;

  throw new Error(
    `No project matched "${input}". Available: ${projects.map((p) => p.name).join(", ")}`
  );
}
