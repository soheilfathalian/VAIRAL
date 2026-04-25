import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { generateSlate } from "@/lib/pipeline/slate";
import { resolveProject } from "@/lib/peec/projects";
import { hasLLM } from "@/lib/llm/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!hasLLM) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { project?: string };
    const target = resolveProject(body.project);
    const slate = await generateSlate(target.id);

    const dir = "data/slate";
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeFile(join(dir, `${target.alias}-${stamp}.json`), JSON.stringify(slate, null, 2));
    await writeFile(join(dir, "latest.json"), JSON.stringify(slate, null, 2));

    return NextResponse.json({ ok: true, brand: slate.brand.name, project: target });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
