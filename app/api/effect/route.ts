import { NextResponse } from "next/server";
import { peec, dateRange } from "@/lib/peec/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const promptId = searchParams.get("promptId");
  const brandId = searchParams.get("brandId");

  if (!projectId || !promptId) {
    return NextResponse.json({ error: "Missing projectId or promptId" }, { status: 400 });
  }

  try {
    const range = dateRange(30);

    const [chatsResult, brandsResult] = await Promise.allSettled([
      peec.listChats(projectId, { ...range, prompt_id: promptId, limit: 100 }),
      peec.brandReport(projectId, {
        ...range,
        filters: { prompt_id: promptId },
      }),
    ]);

    const chats = chatsResult.status === "fulfilled" ? chatsResult.value : [];
    const brands = brandsResult.status === "fulfilled" ? brandsResult.value : [];

    const ownBrand = brandId
      ? (brands.find((b: any) => b.brand?.id === brandId) ?? brands[0] ?? null)
      : (brands[0] ?? null);

    return NextResponse.json({
      promptId,
      chatCount: chats.length,
      ownBrand: ownBrand
        ? {
            visibility: ownBrand.visibility ?? 0,
            sentiment: ownBrand.sentiment ?? 0,
            position: ownBrand.position ?? 0,
            share_of_voice: ownBrand.share_of_voice ?? 0,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Effect API error:", error);
    return NextResponse.json({ error: error.message ?? "Internal error" }, { status: 500 });
  }
}
