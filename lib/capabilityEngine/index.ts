import { ProviderType, DiscoveryResult } from '../../types';
import { discoverGemini } from '../providers/gemini';
import { discoverOpenAI } from '../providers/openai';
import { discoverGroq } from '../providers/groq';
import { discoverAnthropic } from '../providers/anthropic';
import { discoverPerplexity } from '../providers/perplexity';

export function detectProvider(apiKey: string): ProviderType | 'unknown' {
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('gsk_')) return 'groq';
  if (apiKey.startsWith('AIza')) return 'gemini';
  if (apiKey.startsWith('pplx-')) return 'perplexity';
  if (apiKey.startsWith('sk-proj-') || apiKey.startsWith('sk-')) return 'openai';
  return 'unknown';
}

export async function discoverCapabilities(
  provider: ProviderType | 'auto',
  apiKey: string
): Promise<DiscoveryResult> {
  let resolvedProvider: ProviderType | 'unknown' | 'auto' = provider;
  
  if (provider === 'auto') {
    resolvedProvider = detectProvider(apiKey);
    if (resolvedProvider === 'unknown') {
      throw new Error('Could not automatically detect the API provider from the key format. Please select it manually.');
    }
  }

  if (resolvedProvider === 'gemini') {
    return discoverGemini(apiKey);
  }
  if (resolvedProvider === 'openai') {
    return discoverOpenAI(apiKey);
  }
  if (resolvedProvider === 'anthropic') {
    return discoverAnthropic(apiKey);
  }
  if (resolvedProvider === 'groq') {
    return discoverGroq(apiKey);
  }
  if (resolvedProvider === 'perplexity') {
    return discoverPerplexity(apiKey);
  }

  throw new Error(`Unsupported provider: ${resolvedProvider}`);
}
