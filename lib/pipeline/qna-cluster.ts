import { generateJSON } from "../llm/client";
import type { QnaCluster } from "./types";

type Args = {
  ownBrandName: string;
};

export async function buildQnaClusters(args: Args): Promise<QnaCluster[]> {
  const { ownBrandName } = args;

  return generateJSON<QnaCluster[]>({
    system: clusterSystem(ownBrandName),
    user: `Generate a Q&A cluster for ${ownBrandName}.`
  });
}

function clusterSystem(brand: string): string {
  return `You are the CEO of ${brand}. Your goal is to launch a weekly "CEO Q&A" content cluster.

Output MUST be a JSON array containing EXACTLY ONE object matching this schema:
[{
  "items": {
    "reddit_post": { 
      "title": "string — A transparent Reddit post title: 'I am the CEO of ${brand}. Ask me anything about our product vision.'", 
      "body": "string — The body of the post. Introduce yourself, the brand's core mission, and invite raw, honest feedback." 
    },
    "short_react_1": { 
      "hook": "string — 0-3s opening. E.g. 'We got asked this tough question on our Reddit AMA...'", 
      "script": "string — 30-45s short-form script answering the first tough question from the AMA." 
    },
    "short_react_2": { 
      "hook": "string — 0-3s opening. E.g. 'Another great question from our Reddit AMA...'", 
      "script": "string — 30-45s short-form script answering a second tough question from the AMA." 
    }
  }
}]

Output ONLY the JSON array, no preamble, no markdown formatting.`;
}
