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

const MODEL_CHAIN: string[] = (process.env.GEMINI_MODEL_CHAIN ?? "gemini-3.1-pro-preview,gemini-2.5-pro,gemini-2.5-flash-lite").split(",").map((s) => s.trim());

const isQuotaError = (e: unknown) => {
  const msg = (e as Error)?.message ?? String(e);
  return msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.toLowerCase().includes("quota");
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOnce(model: string, contents: string, config: Record<string, unknown>) {
  const c = client();
  const res = await c.models.generateContent({ model, contents, config: config as never });
  return { text: res.text ?? "", modelUsed: model };
}

async function callWithChain(contents: string, config: Record<string, unknown>): Promise<{ text: string; modelUsed: string }> {
  let lastErr: unknown;
  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    const isLast = i === MODEL_CHAIN.length - 1;
    const attempts = isLast ? 4 : 1;
    for (let a = 0; a < attempts; a++) {
      try {
        return await callOnce(model, contents, config);
      } catch (e) {
        lastErr = e;
        if (!isQuotaError(e)) {
          if (i < MODEL_CHAIN.length - 1) {
            console.warn(`[llm] ${model} non-quota error, trying next: ${(e as Error).message?.slice(0, 80)}`);
            break;
          }
          throw e;
        }
        if (isLast && a < attempts - 1) {
          const delayMs = 1500 * Math.pow(2, a) + Math.floor(Math.random() * 600);
          console.warn(`[llm] ${model} 429 (attempt ${a + 1}/${attempts}), backing off ${delayMs}ms`);
          await sleep(delayMs);
        } else if (!isLast) {
          console.warn(`[llm] ${model} quota exhausted → trying ${MODEL_CHAIN[i + 1]}`);
        }
      }
    }
  }
  throw lastErr;
}

export async function generateJSON<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const cfg = {
    systemInstruction: opts.system,
    responseMimeType: "application/json",
    maxOutputTokens: opts.maxTokens ?? 8192,
    temperature: opts.temperature ?? 0.7,
  };

  const { text, modelUsed } = await callWithChain(opts.user, cfg);

  if (!text) throw new Error(`Gemini (${modelUsed}) returned empty response`);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Truncation recovery: if the response looks like a JSON array that was cut
    // off mid-stream, extract all fully-closed objects and parse those.
    if (cleaned.startsWith("[")) {
      const objects: unknown[] = [];
      // Match top-level {...} blocks (handles nesting up to ~5 levels)
      const re = /\{(?:[^{}]|\{(?:[^{}]|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*\})*\}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(cleaned)) !== null) {
        try { objects.push(JSON.parse(m[0])); } catch { /* skip malformed fragment */ }
      }
      if (objects.length > 0) {
        console.warn(`[llm] ${modelUsed} response was truncated — recovered ${objects.length} complete object(s)`);
        return objects as T;
      }
    }
    throw new Error(
      `Gemini (${modelUsed}) returned non-JSON:\n${text.slice(0, 500)}\n\nParse error: ${(e as Error).message}`
    );
  }
}
