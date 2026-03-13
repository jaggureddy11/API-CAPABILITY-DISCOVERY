/* eslint-disable @typescript-eslint/no-explicit-any */
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN;
const PRIMARY_MODEL = "google/flan-t5-large";
const BACKUP_MODEL = "facebook/bart-large-cnn";
const BASE_URL = "https://api-inference.huggingface.co/models";

async function callHF(prompt: string, modelUrl = PRIMARY_MODEL): Promise<string> {
  if (!HF_TOKEN) {
    console.warn('APILens: Add NEXT_PUBLIC_HF_TOKEN to .env.local for AI features');
    throw new Error('No HF token');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${BASE_URL}/${modelUrl}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.3,
          return_full_text: false,
          do_sample: false
        },
        options: {
          wait_for_model: true,
          use_cache: true
        }
      })
    });
    clearTimeout(timeout);

    if (res.status === 503) {
      // Model loading — wait and retry once
      await new Promise(r => setTimeout(r, 8000));
      return callHF(prompt, modelUrl);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.warn(`APILens HF API Error (${modelUrl}): ${res.status} ${errorText}`);
      if (modelUrl === PRIMARY_MODEL) {
        return callHF(prompt, BACKUP_MODEL);
      }
      throw new Error("Both models unavailable");
    }

    const data = await res.json();
    return data[0]?.generated_text ?? 
           data?.generated_text ?? 
           data?.summary_text ?? "";
           
  } catch (e) {
    clearTimeout(timeout);
    if (modelUrl === PRIMARY_MODEL) {
      return callHF(prompt, BACKUP_MODEL);
    }
    throw e;
  }
}

export async function getScanSummary(scanData: any): Promise<string> {
  const granted = scanData.capabilities ? Object.values(scanData.capabilities).filter((c: any) => c.supported).map((c: any) => c.name) : [];
  const denied = scanData.capabilities ? Object.values(scanData.capabilities).filter((c: any) => !c.supported).map((c: any) => c.name) : [];
  const models = scanData.models ? scanData.models.map((m: any) => m.id) : (scanData.topModels ? scanData.topModels.map((m: any) => m.id) : []);

  const prompt = `Summarize this API key scan result: Provider ${scanData.provider}, status ${scanData.status}, capabilities: ${granted.join(', ')}, denied: ${denied.join(', ')}, models: ${models.slice(0, 5).join(', ')}`;
  return await callHF(prompt);
}

export async function getAdvisorCards(scanData: any): Promise<any[]> {
  const capabilities = scanData.capabilities ? Object.values(scanData.capabilities).filter((c: any) => c.supported).map((c: any) => c.name).join(", ") : "none";
  const models = scanData.models ? scanData.models.map((m: any) => m.id) : (scanData.topModels ? scanData.topModels.map((m: any) => m.id) : []);
  const rateLimit = scanData.rateLimits?.requestsPerMinute ? scanData.rateLimits.requestsPerMinute * 60 * 24 : "unknown";

  const p1 = `What is one security or usage warning for an API key with these permissions: ${capabilities}`;
  const p2 = `What is one cost optimization tip for a developer using ${scanData.provider} API with models ${models.slice(0, 3).join(', ')}`;
  const p3 = `What is one interesting insight about using ${scanData.provider} API with rate limit of ${rateLimit} requests per day`;

  try {
    const [wBody, tBody, iBody] = await Promise.all([
      callHF(p1).catch(() => "Monitor usage closely to prevent unexpected charges or rate limits."),
      callHF(p2).catch(() => "Consider routing simpler tasks to cheaper models to save costs."),
      callHF(p3).catch(() => "Higher rate limits allow for more parallel processing and background tasks.")
    ]);

    return [
      { type: "warning", title: "Security Notice", body: wBody.trim() || "Monitor usage closely to prevent unexpected charges or rate limits." },
      { type: "tip", title: "Cost Optimization", body: tBody.trim() || "Consider routing simpler tasks to cheaper models to save costs." },
      { type: "insight", title: "Usage Insight", body: iBody.trim() || "Higher rate limits allow for more parallel processing and background tasks." }
    ];
  } catch {
    return [];
  }
}

export async function parseCostQuery(query: string, _models: string[]): Promise<any> {
  const prompt = `Extract daily API calls and token count from: ${query}. Reply with only: calls=NUMBER tokens=NUMBER`;
  try {
    const text = await callHF(prompt);
    const callsMatch = text.match(/calls=(\d+)/i);
    const tokensMatch = text.match(/tokens=(\d+)/i);
    
    const calls = callsMatch ? parseInt(callsMatch[1], 10) : undefined;
    const tokens = tokensMatch ? parseInt(tokensMatch[1], 10) : undefined;
    
    return {
      callsPerDay: calls,
      inputTokens: tokens ? Math.floor(tokens * 0.7) : undefined,
      outputTokens: tokens ? Math.ceil(tokens * 0.3) : undefined,
      explanation: "Parsed values from your query."
    };
  } catch {
    return null;
  }
}

export async function getModelRecommendation(useCase: string, models: string[]): Promise<any> {
  const prompt = `Which model from this list is best for ${useCase}? List: ${models.join(', ')}. Answer with only the model name.`;
  try {
    let text = await callHF(prompt);
    text = text.trim();
    
    let recommended = models[0];
    
    // Attempt to match an exact model from the response
    for (const m of models) {
      if (text.toLowerCase().includes(m.toLowerCase())) {
        recommended = m;
        break;
      }
    }
    
    return {
      recommended,
      reason: `${text || recommended} is recommended for your use case based on capability and cost balance.`,
      tradeoff: "Evaluate generation speed against specific task reasoning depth.",
      estimatedCost: "Cost scales dynamically with token volume."
    };
  } catch {
    return null;
  }
}
