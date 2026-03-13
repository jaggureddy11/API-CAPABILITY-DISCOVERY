/* eslint-disable @typescript-eslint/no-explicit-any */
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN;
const PRIMARY_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";
const BACKUP_MODEL  = "HuggingFaceH4/zephyr-7b-beta";
const BASE_URL = "https://api-inference.huggingface.co/models";

async function callHF(prompt: string, modelUrl = PRIMARY_MODEL): Promise<string> {
  if (!HF_TOKEN) {
      console.warn('APILens: Add NEXT_PUBLIC_HF_TOKEN to .env.local for AI features');
      throw new Error('No HF token');
  }
  
  const res = await fetch(`${BASE_URL}/${modelUrl}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 350,
        temperature: 0.4,
        return_full_text: false
      }
    })
  });

  if (!res.ok) {
    // Try backup model
    if (modelUrl === PRIMARY_MODEL) {
      return callHF(prompt, BACKUP_MODEL);
    }
    throw new Error("Both models unavailable");
  }

  const data = await res.json();
  return data[0]?.generated_text ?? "";
}

function extractJSON(text: string) {
  try { return JSON.parse(text.trim()); } catch {}
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
  return null;
}

export async function getScanSummary(scanData: any): Promise<string> {
  const granted = scanData.capabilities ? Object.values(scanData.capabilities).filter((c:any) => c.supported).map((c:any) => c.name).join(", ") : '';
  const denied = scanData.capabilities ? Object.values(scanData.capabilities).filter((c:any) => !c.supported).map((c:any) => c.name).join(", ") : '';
  const models = scanData.models ? scanData.models.slice(0,5).map((m:any) => m.id).join(", ") : (scanData.topModels ? scanData.topModels.slice(0,5).map((m:any) => m.id).join(", ") : '');

  const prompt = `<s>[INST] Summarize this API key scan in 2-3 sentences for a developer. Be direct and technical. No intro phrases. Just the summary.

Provider: ${scanData.provider}
Status: ${scanData.status}
Capabilities granted: ${granted}
Capabilities denied: ${denied}
Models: ${models}
Rate limits: ${JSON.stringify(scanData.rateLimits ?? {})} [/INST]`;
  return await callHF(prompt);
}

export async function getAdvisorCards(scanData: any): Promise<any[]> {
  const granted = scanData.capabilities ? Object.values(scanData.capabilities).filter((c:any) => c.supported).map((c:any) => c.name).join(", ") : '';
  const denied = scanData.capabilities ? Object.values(scanData.capabilities).filter((c:any) => !c.supported).map((c:any) => c.name).join(", ") : '';
  const models = scanData.models ? scanData.models.slice(0,5).map((m:any) => m.id).join(", ") : (scanData.topModels ? scanData.topModels.slice(0,5).map((m:any) => m.id).join(", ") : '');

  const prompt = `<s>[INST] You are an API advisor. Give exactly 3 recommendations based on this scan. Return ONLY valid JSON array, nothing else:
[
  {"type":"warning","title":"short title","body":"1-2 sentence recommendation"},
  {"type":"tip","title":"short title","body":"1-2 sentence recommendation"},
  {"type":"insight","title":"short title","body":"1-2 sentence recommendation"}
]

Provider: ${scanData.provider}
Capabilities granted: ${granted}
Capabilities denied: ${denied}
Models: ${models} [/INST]`;
  const text = await callHF(prompt);
  return extractJSON(text) ?? [];
}

export async function parseCostQuery(query: string, models: string[]): Promise<any> {
  const prompt = `<s>[INST] Parse this API cost query. Available models: ${models.join(", ")}. Return ONLY valid JSON, nothing else:
{"model":"exact-model-id","callsPerDay":number,"inputTokens":number,"outputTokens":number,"explanation":"one sentence"}

If calls not specified use 1000. If tokens not specified use 500 total split 70% input 30% output.

Query: ${query} [/INST]`;
  const text = await callHF(prompt);
  return extractJSON(text);
}

export async function getModelRecommendation(useCase: string, models: string[]): Promise<any> {
  const prompt = `<s>[INST] You are a model selection expert. From ONLY these models: ${models.join(", ")}. Return ONLY valid JSON, nothing else:
{"recommended":"exact-model-id","reason":"2 sentences max","tradeoff":"1 sentence","estimatedCost":"e.g. ~$2/day at 1k calls"}

Use case: ${useCase} [/INST]`;
  const text = await callHF(prompt);
  return extractJSON(text);
}
