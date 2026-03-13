import type { NextApiRequest, NextApiResponse } from "next";

const GROQ_KEY = process.env.GROQ_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "llama3-8b-8192";

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 350,
      temperature: 0.4
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractJSON(text: string): any {
  try { return JSON.parse(text.trim()); } catch {}
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GROQ_KEY) {
    return res.status(500).json({ error: "GROQ_KEY not configured" });
  }

  const { feature, data } = req.body;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = null;

    if (feature === "summary") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const granted = data.capabilities?.filter((c:any) => c.supported).map((c:any) => c.name).join(", ") ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const denied = data.capabilities?.filter((c:any) => !c.supported).map((c:any) => c.name).join(", ") ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const models = data.models?.slice(0,5).map((m:any) => m.id).join(", ") ?? "";

      const prompt = `Summarize this API key scan in 
exactly 2-3 sentences for a developer. Be direct 
and technical. No intro phrases. Just the finding.

Provider: ${data.provider}
Status: ${data.status}
Capabilities granted: ${granted}
Capabilities denied: ${denied}
Top models: ${models}
Rate limits: ${JSON.stringify(data.rateLimits ?? {})}`;

      result = await callGroq(prompt);
    }

    else if (feature === "advisor") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const granted = data.capabilities?.filter((c:any) => c.supported).map((c:any) => c.name).join(", ") ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const denied = data.capabilities?.filter((c:any) => !c.supported).map((c:any) => c.name).join(", ") ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const models = data.models?.slice(0,5).map((m:any) => m.id).join(", ") ?? "";

      const prompt = `You are an API advisor.
Give exactly 3 recommendations for this developer.
Return ONLY a valid JSON array, no other text:
[
  {"type":"warning","title":"short title","body":"1-2 sentences"},
  {"type":"tip","title":"short title","body":"1-2 sentences"},
  {"type":"insight","title":"short title","body":"1-2 sentences"}
]

Provider: ${data.provider}
Granted: ${granted}
Denied: ${denied}
Models: ${models}`;

      const text = await callGroq(prompt);
      result = extractJSON(text) ?? [
        {
          type: "warning",
          title: "Review Permissions",
          body: `Some capabilities are restricted on your ${data.provider} key.`
        },
        {
          type: "tip",
          title: "Cost Optimization",
          body: "Use smaller models for simple tasks to reduce costs significantly."
        },
        {
          type: "insight",
          title: "Key Scope",
          body: `Your key unlocks ${data.models?.length ?? 0} models on ${data.provider}.`
        }
      ];
    }

    else if (feature === "costquery") {
      const prompt = `Parse this API cost query.
Return ONLY valid JSON, no other text:
{
  "model": "best match from: ${data.models?.slice(0,8).join(", ")}",
  "callsPerDay": number,
  "inputTokens": number,
  "outputTokens": number,
  "explanation": "one sentence"
}

Defaults if not specified:
callsPerDay = 1000
inputTokens = 350  
outputTokens = 150

Query: "${data.query}"`;

      const text = await callGroq(prompt);
      result = extractJSON(text);
    }

    else if (feature === "recommend") {
      const prompt = `You are a model selection expert.
From ONLY these models: ${data.models?.join(", ")}

Return ONLY valid JSON, no other text:
{
  "recommended": "exact model id",
  "reason": "2 sentences why",
  "tradeoff": "1 sentence tradeoff",
  "estimatedCost": "e.g. ~$2/day at 1k calls"
}

Use case: "${data.useCase}"`;

      const text = await callGroq(prompt);
      result = extractJSON(text);
    }

    else {
      return res.status(400).json({ error: "Unknown feature" });
    }

    return res.status(200).json({ result });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("AI route error:", error.message);
    return res.status(500).json({ 
      error: error.message ?? "AI request failed" 
    });
  }
}
