import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const KEY = process.env.GEMINI_API_KEY;

export const hasLLM = Boolean(KEY);

let _client: GoogleGenAI | null = null;
function client(): GoogleGenAI {
  if (!_client) {
    if (!KEY) throw new Error("GEMINI_API_KEY missing in .env");
    _client = new GoogleGenAI({ apiKey: KEY });
  }
  return _client;
}

export const PRIMARY_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-pro-preview";
export const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-pro";

export async function generateJSON<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const c = client();
  const cfg = {
    systemInstruction: opts.system,
    responseMimeType: "application/json",
    maxOutputTokens: opts.maxTokens ?? 8192,
    temperature: opts.temperature ?? 0.7,
  };

  let modelUsed = PRIMARY_MODEL;
  let res;
  try {
    res = await c.models.generateContent({ model: PRIMARY_MODEL, contents: opts.user, config: cfg });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    const isQuota = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.includes("quota");
    if (!isQuota || PRIMARY_MODEL === FALLBACK_MODEL) throw e;
    console.warn(`[llm] ${PRIMARY_MODEL} quota exhausted → falling back to ${FALLBACK_MODEL}`);
    modelUsed = FALLBACK_MODEL;
    res = await c.models.generateContent({ model: FALLBACK_MODEL, contents: opts.user, config: cfg });
  }

  const text = res.text ?? "";
  if (!text) throw new Error(`Gemini (${modelUsed}) returned empty response`);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(
      `Gemini (${modelUsed}) returned non-JSON:\n${text.slice(0, 500)}\n\nParse error: ${(e as Error).message}`
    );
  }
}
