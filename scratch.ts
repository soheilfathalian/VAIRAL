import { generateJSON } from "./lib/llm/client";
import "dotenv/config";

async function run() {
  try {
    const res = await generateJSON({
      system: `You are an outreach strategist helping TestBrand pitch guest appearances and collaborations.
Output must be a JSON array.
{
  "channel_title": "string",
  "channel_url": "string"
}`,
      user: JSON.stringify({ brand: "TestBrand", candidates: [{channel_title: "TestChannel", channel_url: "http://test.com", total_retrievals: 10, total_citations: 5}] })
    });
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
