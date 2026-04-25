import "dotenv/config";
import { peec } from "./client.js";

export type ProjectAlias = { alias: string; id: string; label: string };

export const KNOWN_ALIASES: ProjectAlias[] = [
  {
    alias: "nothing",
    id: process.env.PEEC_PROJECT_NOTHING ?? "or_faaa7625-bc84-4f64-a754-a412d423c641",
    label: "Nothing Phone",
  },
  {
    alias: "attio",
    id: process.env.PEEC_PROJECT_ATTIO ?? "or_47ccb54e-0f32-4c95-b460-6a070499d084",
    label: "Attio",
  },
];

export function resolveProject(input: string | undefined): { id: string; alias: string; label: string } {
  if (!input) {
    const def = KNOWN_ALIASES[0];
    return { id: def.id, alias: def.alias, label: def.label };
  }
  const normalised = input.toLowerCase().trim();
  const known = KNOWN_ALIASES.find((p) => p.alias === normalised);
  if (known) return { id: known.id, alias: known.alias, label: known.label };
  if (input.startsWith("or_")) return { id: input, alias: input, label: input };
  throw new Error(
    `Unknown project: "${input}". Use a known alias (${KNOWN_ALIASES.map((p) => p.alias).join(", ")}) or a full project_id starting with or_`
  );
}

export async function listAccessibleProjects() {
  return peec.listProjects();
}
