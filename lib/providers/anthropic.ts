import { DiscoveryResult, Capabilities, CapabilityStatus, ModelDetail, RateLimits } from '../../types';

const defaultCap = (): CapabilityStatus => ({ supported: false, tested: false });

export async function discoverAnthropic(apiKey: string): Promise<DiscoveryResult> {
  const capabilities: Capabilities = {
    textGeneration: defaultCap(), embeddings: defaultCap(), imageGeneration: defaultCap(),
    audioGeneration: defaultCap(), videoGeneration: defaultCap()
  };
  
  const headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', { headers });

    if (response.status === 401 || response.status === 403) {
      return { provider: 'anthropic', status: 'invalid', error: 'API key not valid or unauthorized', capabilities, topModels: [], allModels: [] };
    }
    if (!response.ok) throw new Error(`Fetch models failed: ${response.status}`);

    const data = await response.json();
    const modelsRaw = data.data || [];

    // Active test: Text Generation
    const textRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1, messages: [{role: 'user', content: 'test'}] })
    });
    capabilities.textGeneration.tested = true;
    if (textRes.ok) capabilities.textGeneration.supported = true;
    else if (textRes.status === 400 || textRes.status === 403) {
        capabilities.textGeneration.supported = textRes.status === 400; // 400 = bad req but auth works, 403 = permission denied or quota
        capabilities.textGeneration.error = `HTTP ${textRes.status}`;
    }

    // Embeddings, Images etc are not natively public on v1 yet for Anthropic aside from bedrock/vertex
    capabilities.embeddings.tested = true; capabilities.embeddings.supported = false;
    capabilities.imageGeneration.tested = true; capabilities.imageGeneration.supported = false;
    capabilities.audioGeneration.tested = true; capabilities.audioGeneration.supported = false;
    capabilities.videoGeneration.tested = true; capabilities.videoGeneration.supported = false;

    const allModels: ModelDetail[] = [];
    const topModels: ModelDetail[] = [];
    const topModelNames = ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-5-haiku-20241022'];

    modelsRaw.forEach((m: any) => {
        let outTokens = 4096;
        if (m.id.includes('3-7-sonnet')) outTokens = 128000;
        else if (m.id.includes('3-5')) outTokens = 8192;

        const detail: ModelDetail = { 
            id: m.id, verified: true, permissionDenied: false, 
            maxInputTokens: 200000, maxOutputTokens: outTokens 
        };
        allModels.push(detail);
        if (topModelNames.includes(m.id)) topModels.push(detail);
    });

    for (const tm of topModelNames) {
        if (!allModels.find(x => x.id === tm)) {
            topModels.push({ id: tm, verified: false, permissionDenied: true });
        }
    }

    return { provider: 'anthropic', status: 'valid', capabilities, topModels, allModels };
  } catch(err: any){
      return { provider: 'anthropic', status: 'error', error: err.message, capabilities, topModels: [], allModels: [] };
  }
}
