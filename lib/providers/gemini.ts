import { DiscoveryResult, Capabilities, CapabilityStatus, ModelDetail, RateLimits } from '../../types';

const defaultCap = (): CapabilityStatus => ({ supported: false, tested: false });

export async function discoverGemini(apiKey: string): Promise<DiscoveryResult> {
  const capabilities: Capabilities = {
    textGeneration: defaultCap(), embeddings: defaultCap(), imageGeneration: defaultCap(),
    audioGeneration: defaultCap(), videoGeneration: defaultCap()
  };

  const rateLimits: RateLimits = {};

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (response.status === 400 || response.status === 403) {
      return { provider: 'gemini', status: 'invalid', error: 'API key not valid', capabilities, topModels: [], allModels: [] };
    }
    if (!response.ok) throw new Error('Failed to fetch. Check console.');

    const data = await response.json();
    const modelsRaw = data.models || [];

    const topModelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'text-embedding-004', 'imagen-3.0-generate-001', 'veo-2.0-generate-001'];
    
    // Active test: Text Generation
    const textTest = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ contents: [{role: 'user', parts: [{text: 'capability test'}]}]})
    });
    capabilities.textGeneration.tested = true;
    if (textTest.ok) {
        capabilities.textGeneration.supported = true;
    } else if (textTest.status === 400 || textTest.status === 403) {
        capabilities.textGeneration.supported = textTest.status === 400;
        capabilities.textGeneration.error = `HTTP ${textTest.status}`;
    }

    // Active test: Embeddings
    const embTest = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({}) // Intentionally empty
    });
    capabilities.embeddings.tested = true;
    capabilities.embeddings.supported = (embTest.status === 400 || embTest.ok);
    if (!capabilities.embeddings.supported) capabilities.embeddings.error = `HTTP ${embTest.status}`;

    const allModels: ModelDetail[] = [];
    const topModels: ModelDetail[] = [];

    capabilities.imageGeneration.tested = true; capabilities.imageGeneration.supported = false;
    capabilities.videoGeneration.tested = true; capabilities.videoGeneration.supported = false;
    capabilities.audioGeneration.tested = true; capabilities.audioGeneration.supported = false;

    // Scan properties manually for accurate media capability mapping
    modelsRaw.forEach((m: any) => {
        const id = m.name.replace(/^models\//, '');
        const detail: ModelDetail = {
            id, verified: true, permissionDenied: false,
            maxInputTokens: m.inputTokenLimit,
            maxOutputTokens: m.outputTokenLimit
        };
        allModels.push(detail);

        const methods = m.supportedGenerationMethods || [];
        if (id.includes('imagen') && methods.includes('predict')) capabilities.imageGeneration.supported = true;
        if (id.includes('veo') && methods.includes('predictLongRunning')) capabilities.videoGeneration.supported = true;
        if (id.includes('audio') && methods.includes('bidiGenerateContent')) capabilities.audioGeneration.supported = true;
    });

    for (const tm of topModelNames) {
        const found = allModels.find(x => x.id === tm);
        if (found) topModels.push(found);
        else topModels.push({ id: tm, verified: false, permissionDenied: true });
    }

    return {
        provider: 'gemini', status: 'valid', capabilities, topModels, allModels, rateLimits
    };
  } catch(err: any){
      return { provider: 'gemini', status: 'error', error: err.message, capabilities, topModels: [], allModels: [] };
  }
}
