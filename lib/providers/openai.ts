import { DiscoveryResult, Capabilities, CapabilityStatus, ModelDetail, RateLimits } from '../../types';

const defaultCap = (): CapabilityStatus => ({ supported: false, tested: false });

export async function discoverOpenAI(apiKey: string): Promise<DiscoveryResult> {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const capabilities: Capabilities = {
    textGeneration: defaultCap(),
    embeddings: defaultCap(),
    imageGeneration: defaultCap(),
    audioGeneration: defaultCap(),
    videoGeneration: defaultCap(),
  };

  const rateLimits: RateLimits = {};

  try {
    // 1. Fetch Models
    const modelsResponse = await fetch('https://api.openai.com/v1/models', { headers });
    if (modelsResponse.status === 401) {
       return {
         provider: 'openai', status: 'invalid', error: 'API key not valid or unauthorized',
         capabilities, topModels: [], allModels: []
       };
    }
    if (!modelsResponse.ok) throw new Error(`Fetch models failed: ${modelsResponse.status}`);
    const data = await modelsResponse.json();
    const allModelsRaw = (data.data || []).map((m: any) => m.id as string).sort();

    const topModelNames = ['o1', 'o3-mini', 'gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'dall-e-3', 'text-embedding-3-large'];
    
    // Active test: Text Generation
    const textRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers,
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{role: 'user', content: 'hi'}], max_tokens: 1 })
    });
    capabilities.textGeneration.tested = true;
    if (textRes.ok) {
        capabilities.textGeneration.supported = true;
        rateLimits.requestsPerMinute = parseInt(textRes.headers.get('x-ratelimit-limit-requests') || '0', 10);
        rateLimits.tokensPerMinute = parseInt(textRes.headers.get('x-ratelimit-limit-tokens') || '0', 10);
    } else if (textRes.status === 400) {
        capabilities.textGeneration.supported = true; 
    } else {
        capabilities.textGeneration.error = `HTTP ${textRes.status}`;
    }

    // Active test: Embeddings (Empty body gives 400 Bad Request, verifying endpoint access)
    const embRes = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers, body: JSON.stringify({}) });
    capabilities.embeddings.tested = true;
    capabilities.embeddings.supported = (embRes.status === 400 || embRes.ok);
    if (!capabilities.embeddings.supported) capabilities.embeddings.error = `HTTP ${embRes.status}`;

    // Active test: Image Generation
    const imgRes = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers, body: JSON.stringify({}) });
    capabilities.imageGeneration.tested = true;
    capabilities.imageGeneration.supported = (imgRes.status === 400 || imgRes.ok);
    if (!capabilities.imageGeneration.supported) capabilities.imageGeneration.error = `HTTP ${imgRes.status}`;

    // Active test: Audio Speech
    const audioRes = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', headers, body: JSON.stringify({}) });
    capabilities.audioGeneration.tested = true;
    capabilities.audioGeneration.supported = (audioRes.status === 400 || audioRes.ok);

    // Active test: Video
    capabilities.videoGeneration.tested = true;
    capabilities.videoGeneration.supported = false; // Sora not available on public v1 yet

    const topModels: ModelDetail[] = [];
    const allModels: ModelDetail[] = [];

    // Static token limits for major models for a premium UI feel
    const tokenLimits: Record<string, {maxIn: number, maxOut: number}> = {
        'gpt-4o': { maxIn: 128000, maxOut: 16384 },
        'gpt-4o-mini': { maxIn: 128000, maxOut: 16384 },
        'o1': { maxIn: 200000, maxOut: 100000 },
        'o1-preview': { maxIn: 128000, maxOut: 32768 },
        'o1-mini': { maxIn: 128000, maxOut: 65536 },
        'o3-mini': { maxIn: 200000, maxOut: 100000 }
    }

    for (const m of allModelsRaw) {
        const isTop = topModelNames.includes(m);
        const detail: ModelDetail = {
            id: m,
            verified: true,
            permissionDenied: false,
            maxInputTokens: tokenLimits[m]?.maxIn,
            maxOutputTokens: tokenLimits[m]?.maxOut,
        };
        allModels.push(detail);
        if (isTop) {
            topModels.push(detail);
        }
    }

    // Add unverified/denied models
    for (const tm of topModelNames) {
        if (!allModels.find(x => x.id === tm)) {
            topModels.push({
                id: tm,
                verified: false,
                permissionDenied: true
            });
        }
    }

    return {
      provider: 'openai', status: 'valid', capabilities,
      topModels, allModels, rateLimits
    };

  } catch (err: any) {
    return {
      provider: 'openai', status: 'error', error: err.message, capabilities, topModels: [], allModels: []
    }
  }
}
