export type ProviderType = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'auto';

export interface CapabilityStatus {
  supported: boolean;
  tested: boolean;
  error?: string;
}

export interface Capabilities {
  textGeneration: CapabilityStatus;
  embeddings: CapabilityStatus;
  imageGeneration: CapabilityStatus;
  audioGeneration: CapabilityStatus;
  videoGeneration: CapabilityStatus;
}

export interface ModelDetail {
  id: string;
  verified: boolean;
  permissionDenied: boolean;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface RateLimits {
  requestsPerMinute?: number;
  tokensPerMinute?: number;
  info?: string;
}

export interface DiscoveryResult {
  provider: ProviderType;
  status: 'valid' | 'invalid' | 'error';
  error?: string;
  capabilities: Capabilities;
  topModels: ModelDetail[];
  allModels: ModelDetail[];
  rateLimits?: RateLimits;
}
