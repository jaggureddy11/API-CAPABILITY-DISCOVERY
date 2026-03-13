import { DiscoveryResult, Capabilities, CapabilityStatus, ModelDetail, RateLimits } from '../../types';

const defaultCap = (): CapabilityStatus => ({ supported: false, tested: false });

export async function discoverGroq(apiKey: string): Promise<DiscoveryResult> {
  const capabilities: Capabilities = {
    textGeneration: defaultCap(), embeddings: defaultCap(), imageGeneration: defaultCap(),
    audioGeneration: defaultCap(), videoGeneration: defaultCap()
  };
  
  const headers = { 'Authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' };
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', { headers });

    if (response.status === 401 || response.status === 403) {
      return { provider: 'groq', status: 'invalid', error: 'API key not valid or unauthorized', capabilities, topModels: [], allModels: [] };
    }
    if (!response.ok) throw new Error(`Fetch models failed: ${response.status}`);

    const data = await response.json();
    const modelsRaw = data.data || [];

    // Active test: Text Generation
    const textRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers,
        body: JSON.stringify({ model: 'llama3-8b-8192', max_tokens: 1, messages: [{role: 'user', content: 'test'}] })
    });
    capabilities.textGeneration.tested = true;
    if (textRes.ok) capabilities.textGeneration.supported = true;
    else if (textRes.status === 400 || textRes.status === 403) {
        capabilities.textGeneration.supported = textRes.status === 400; 
        capabilities.textGeneration.error = `HTTP ${textRes.status}`;
    }

    // Embeddings, Images etc are not natively public on v1 yet for Groq
    capabilities.embeddings.tested = true; capabilities.embeddings.supported = false;
    capabilities.imageGeneration.tested = true; capabilities.imageGeneration.supported = false;
    capabilities.videoGeneration.tested = true; capabilities.videoGeneration.supported = false;

    // Active test: Audio Speech -> Whisper parsing test
    // We send an empty request to the audio endpoint
    const audioRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers });
    capabilities.audioGeneration.tested = true;
    capabilities.audioGeneration.supported = (audioRes.status === 400 || audioRes.status === 200);

    const allModels: ModelDetail[] = [];
    const topModels: ModelDetail[] = [];
    const topModelNames = ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'];

    modelsRaw.forEach((m: any) => {
        const detail: ModelDetail = { id: m.id, verified: true, permissionDenied: false };
        allModels.push(detail);
        if (topModelNames.includes(m.id)) topModels.push(detail);
    });

    for (const tm of topModelNames) {
        if (!allModels.find(x => x.id === tm)) {
            topModels.push({ id: tm, verified: false, permissionDenied: true });
        }
    }

    return { provider: 'groq', status: 'valid', capabilities, topModels, allModels };
  } catch(err: any){
      return { provider: 'groq', status: 'error', error: err.message, capabilities, topModels: [], allModels: [] };
  }
}
