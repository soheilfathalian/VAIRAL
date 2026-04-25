import { NextResponse } from "next/server";
import { KNOWN_ALIASES } from "@/lib/peec/projects";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ projects: KNOWN_ALIASES });
}
