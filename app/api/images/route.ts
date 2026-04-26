import { NextResponse } from "next/server";
import { tavilySearch, hasTavily } from "@/lib/tavily/client";

export async function GET(request: Request) {
  if (!hasTavily) {
    return NextResponse.json({ images: [] });
  }

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");

  if (!topic) {
    return NextResponse.json({ error: "Missing topic parameter" }, { status: 400 });
  }

  try {
    const data = await tavilySearch({
      query: `high quality vertical portrait background images for ${topic} 9:16`,
      include_images: true,
      max_results: 3, // We don't need many search results, just the images
    });

    return NextResponse.json({ images: data.images || [] });
  } catch (error) {
    console.error("Image search failed:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
