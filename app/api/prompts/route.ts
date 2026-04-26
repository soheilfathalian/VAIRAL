import { NextResponse } from "next/server";
import { peec } from "@/lib/peec/client";

export async function POST(request: Request) {
  try {
    const { projectId, text } = await request.json();

    if (!projectId || !text) {
      return NextResponse.json({ error: "Missing projectId or text" }, { status: 400 });
    }

    const prompt = await peec.createPrompt(projectId, { text, country_code: "US" });
    return NextResponse.json(prompt);
  } catch (error: any) {
    console.error("Failed to post prompt:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
