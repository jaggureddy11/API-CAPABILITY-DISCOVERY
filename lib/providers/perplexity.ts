import { DiscoveryResult, Capabilities, CapabilityStatus, ModelDetail, RateLimits } from '../../types';

const defaultCap = (): CapabilityStatus => ({ supported: false, tested: false });

export async function discoverPerplexity(apiKey: string): Promise<DiscoveryResult> {
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
    // 1. Fetch Models (Perplexity does not have a /models endpoint, we verify via a chat completion attempt)
    // and/or assume theSonar models are available if text gen works.
    
    // Active test: Text Generation
    const textRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        model: 'sonar', 
        messages: [{ role: 'user', content: 'hi' }], 
        max_tokens: 1 
      })
    });

    capabilities.textGeneration.tested = true;

    if (textRes.status === 401) {
      return {
        provider: 'perplexity' as any,
        status: 'invalid',
        error: 'API key not valid or unauthorized',
        capabilities,
        topModels: [],
        allModels: []
      };
    }

    if (textRes.ok || textRes.status === 400 || textRes.status === 403) {
      capabilities.textGeneration.supported = textRes.ok || textRes.status === 400;
      
      // Extract rate limits if present
      const rlR = textRes.headers.get('x-ratelimit-limit-requests');
      const rlT = textRes.headers.get('x-ratelimit-limit-tokens');
      if (rlR) rateLimits.requestsPerMinute = parseInt(rlR, 10);
      if (rlT) rateLimits.tokensPerMinute = parseInt(rlT, 10);
    }

    const availableModels = ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'r1-1776'];
    const topModels: ModelDetail[] = [];
    const allModels: ModelDetail[] = [];

    const tokenLimits: Record<string, { maxIn: number, maxOut: number }> = {
      'sonar': { maxIn: 128000, maxOut: 4096 },
      'sonar-pro': { maxIn: 200000, maxOut: 4096 },
      'sonar-reasoning': { maxIn: 128000, maxOut: 4096 },
      'sonar-reasoning-pro': { maxIn: 128000, maxOut: 4096 },
      'r1-1776': { maxIn: 128000, maxOut: 4096 }
    };

    // Since we can't list models, we mark them all as verified if text generation worked, 
    // or just list them as a guess. Usually sonar is always there.
    for (const mId of availableModels) {
      const detail: ModelDetail = {
        id: mId,
        verified: capabilities.textGeneration.supported,
        permissionDenied: !capabilities.textGeneration.supported,
        maxInputTokens: tokenLimits[mId]?.maxIn,
        maxOutputTokens: tokenLimits[mId]?.maxOut,
      };
      allModels.push(detail);
      topModels.push(detail);
    }

    return {
      provider: 'perplexity' as any,
      status: 'valid',
      capabilities,
      topModels,
      allModels,
      rateLimits
    };

  } catch (err: any) {
    return {
      provider: 'perplexity' as any,
      status: 'error',
      error: err.message,
      capabilities,
      topModels: [],
      allModels: []
    };
  }
}
