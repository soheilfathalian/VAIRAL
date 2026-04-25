import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { generateSlate } from "@/lib/pipeline/slate";
import { resolveProject } from "@/lib/peec/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Check at request time, not module-load time (Next.js injects env after module init)
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured in .env" }, { status: 500 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { project?: string };
    const target = await resolveProject(body.project);
    const slate = await generateSlate(target.id);

    const dir = "data/slate";
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const slug = target.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await writeFile(join(dir, `${slug}-${stamp}.json`), JSON.stringify(slate, null, 2));
    await writeFile(join(dir, "latest.json"), JSON.stringify(slate, null, 2));

    return NextResponse.json({ ok: true, brand: slate.brand.name, project: target });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
