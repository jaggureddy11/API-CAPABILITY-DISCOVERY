import type { NextApiRequest, NextApiResponse } from 'next';
import { discoverCapabilities } from '../../lib/capabilityEngine';
import { DiscoveryResult, ProviderType } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiscoveryResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, provider } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }

  if (!provider || !['gemini', 'openai', 'anthropic', 'groq', 'perplexity', 'auto'].includes(provider)) {
    return res.status(400).json({ error: 'Valid provider is required' });
  }

  try {
    const result = await discoverCapabilities(provider as ProviderType | 'auto', apiKey);
    
    // Explicitly do not log the API key
    // Set headers to not cache this response
    res.setHeader('Cache-Control', 'no-store');

    if (result.status === 'invalid' || result.status === 'error') {
        return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
