/* eslint-disable @typescript-eslint/no-explicit-any */

async function callGroq(prompt: string): Promise<string> {
  const token = process.env.NEXT_PUBLIC_GROQ_KEY;
  if (!token) {
    console.warn('APILens: Add NEXT_PUBLIC_GROQ_KEY to .env.local for AI features');
    throw new Error('No Groq token');
  }

  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.4
      })
    }
  );
  
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

function extractJSON(text: string) {
  try { return JSON.parse(text.trim()); } catch {}
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  return null;
}

export async function getScanSummary(scanData: any): Promise<string> {
  const granted = scanData.capabilities
    ? Object.values(scanData.capabilities).filter((c:any) => c.supported).map((c:any) => c.name).join(", ")
    : "";
  const denied = scanData.capabilities
    ? Object.values(scanData.capabilities).filter((c:any) => !c.supported).map((c:any) => c.name).join(", ")
    : "";
  const models = scanData.models
    ? scanData.models.slice(0,5).map((m:any) => m.id).join(", ")
    : (scanData.topModels ? scanData.topModels.slice(0,5).map((m:any) => m.id).join(", ") : "");
    
  const prompt = `Summarize this API key scan in exactly 
2-3 sentences for a developer. Be direct and technical. 
No intro phrases like "Based on" or "This". 
Just start with the finding.

Provider: ${scanData.provider}
Status: ${scanData.status}
Capabilities granted: ${granted}
Capabilities denied: ${denied}
Top models: ${models}
Rate limits: ${JSON.stringify(scanData.rateLimits ?? {})}`;

  return await callGroq(prompt);
}

export async function getAdvisorCards(scanData: any): Promise<any[]> {
  const granted = scanData.capabilities
    ? Object.values(scanData.capabilities).filter((c:any) => c.supported).map((c:any) => c.name).join(", ")
    : "";
  const denied = scanData.capabilities
    ? Object.values(scanData.capabilities).filter((c:any) => !c.supported).map((c:any) => c.name).join(", ")
    : "";
  const models = scanData.models
    ? scanData.models.slice(0,5).map((m:any) => m.id).join(", ")
    : (scanData.topModels ? scanData.topModels.slice(0,5).map((m:any) => m.id).join(", ") : "");

  const prompt = `You are an API advisor. 
Give exactly 3 recommendations for this developer.
Return ONLY a valid JSON array, no other text:
[
  {"type":"warning","title":"short title","body":"1-2 sentences"},
  {"type":"tip","title":"short title","body":"1-2 sentences"},
  {"type":"insight","title":"short title","body":"1-2 sentences"}
]

Provider: ${scanData.provider}
Granted: ${granted}
Denied: ${denied}
Models: ${models}`;

  const text = await callGroq(prompt);
  return extractJSON(text) ?? [
    {
      type: "insight",
      title: "Scan Complete",
      body: `Your ${scanData.provider} key has been analyzed successfully.`
    }
  ];
}

export async function parseCostQuery(
  query: string, 
  models: string[]
): Promise<any> {
  const prompt = `Parse this API cost query and return 
ONLY valid JSON, no other text:
{
  "model": "pick best match from: ${models.slice(0,8).join(", ")}",
  "callsPerDay": number,
  "inputTokens": number,
  "outputTokens": number,
  "explanation": "one sentence summary"
}

If values not specified:
- callsPerDay defaults to 1000
- inputTokens defaults to 350
- outputTokens defaults to 150

Query: "${query}"`;

  const text = await callGroq(prompt);
  return extractJSON(text);
}

export async function getModelRecommendation(
  useCase: string,
  models: string[]
): Promise<any> {
  const prompt = `You are a model selection expert.
From ONLY these available models: ${models.join(", ")}

Return ONLY valid JSON, no other text:
{
  "recommended": "exact model id from the list above",
  "reason": "2 sentences explaining why",
  "tradeoff": "1 sentence on what they give up",
  "estimatedCost": "rough cost e.g. ~$2/day at 1k calls"
}

Use case: "${useCase}"`;

  const text = await callGroq(prompt);
  return extractJSON(text);
}
