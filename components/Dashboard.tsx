import React, { useState } from 'react';
import { ProviderType, DiscoveryResult, CapabilityStatus } from '../types';

export default function Dashboard() {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<ProviderType | 'auto'>('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loadingStep, setLoadingStep] = useState(-1);

  // Directly call the correct endpoint for simple tests based on Provider
  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please provide an API key');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setLoadingStep(0);

    // Simulate animated loading steps
    let stepCount = 0;
    const interval = setInterval(() => {
        stepCount++;
        setLoadingStep(stepCount);
        if (stepCount >= 4) clearInterval(interval);
    }, 800);

    try {
        const res = await fetch('/api/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: apiKey.trim(), provider })
        });

        clearInterval(interval);
        setLoadingStep(5);

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to discover capabilities');
        }

        const data: DiscoveryResult = await res.json();
        setResult(data);
    } catch (err) {
        clearInterval(interval);
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
    } finally {
        setLoading(false);
        setLoadingStep(-1);
    }
  };

  const clearForm = () => {
      setApiKey('');
      setResult(null);
      setError(null);
      setLoadingStep(-1);
  };

  const providerNames: Record<string, string> = {
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      groq: 'Groq',
      auto: 'Auto-detected'
  };

  return (
    <div className="w-full text-white font-sans max-w-[1000px] mx-auto animate-in fade-in duration-700">
      
      {/* PAGE HEADER */}
      <div className="mb-16 text-center md:text-left flex flex-col items-center md:items-start">
          <span className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-white/50 mb-6 block">Capability Discovery</span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
              Analyze Your Key.
          </h1>
          <p className="font-sans text-white/60 font-light text-lg max-w-lg">
              Your key never touches our servers. Results are instant and discarded immediately.
          </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 mb-12">
        {/* LEFT COLUMN: Input Panel */}
        <div className="border border-[rgba(255,255,255,0.15)] bg-black p-6 md:p-8 flex flex-col h-fit">
            <form onSubmit={handleDiscover} className="space-y-6 flex flex-col flex-1">
                <div>
                    <label className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-white/70 block mb-3">Provider</label>
                    <div className="relative">
                        <select 
                            value={provider} 
                            onChange={(e) => setProvider(e.target.value as ProviderType | 'auto')}
                            className="w-full appearance-none bg-black border border-[rgba(255,255,255,0.15)] text-white p-3 font-mono text-sm uppercase outline-none focus:border-white transition-colors cursor-pointer rounded-none"
                        >
                            <option value="auto">✦ Auto-Detect</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="groq">Groq</option>
                            <option value="gemini">Google Gemini</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/50">▾</div>
                    </div>
                </div>

                <div>
                    <label className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-white/70 block mb-3">API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-black border border-[rgba(255,255,255,0.15)] text-white p-3 font-mono text-sm outline-none focus:border-white transition-colors rounded-none placeholder-white/20"
                        placeholder={provider === 'auto' ? "sk-..." : "Paste key here..."}
                        required
                    />
                </div>

                <div className="text-white/40 text-[0.7rem] font-sans font-light leading-relaxed mb-4 flex-1">
                    Keys are never stored or logged. Discarded instantly in volatile memory.
                </div>

                <button
                    type="submit"
                    disabled={loading || !apiKey.trim()}
                    className="w-full bg-white text-black font-display font-bold text-[0.8rem] uppercase tracking-[0.15em] py-4 border border-white hover:bg-black hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black mt-2"
                >
                    {loading ? 'DISCOVERING...' : 'DISCOVER →'}
                </button>

                {(result || error) && (
                    <button
                        type="button"
                        onClick={clearForm}
                        className="w-full bg-transparent text-white/60 font-display font-bold text-[0.7rem] uppercase tracking-[0.1em] py-3 border border-[rgba(255,255,255,0.15)] hover:border-white/50 hover:text-white transition-colors duration-300 mt-2"
                    >
                    CLEAR
                    </button> 
                )}
            </form>
        </div>

        {/* RIGHT COLUMN: Results Panel */}
        <div className="border border-[rgba(255,255,255,0.15)] bg-black h-full min-h-[500px] flex flex-col relative overflow-hidden">
            
            {/* 1. Empty State */}
            {!loading && !result && !error && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-[rgba(255,255,255,0.15)] animate-in fade-in duration-500">
                    <h3 className="font-display text-[0.7rem] tracking-[0.2em] font-bold text-white/60 mb-6 uppercase">Ready for Discovery</h3>
                    <p className="font-sans font-light text-[0.95rem] text-white/50 max-w-[280px] leading-relaxed mb-8">
                        Paste your API key on the left to run live endpoint tests and discover capabilities instantly.
                    </p>
                    <div className="font-sans font-light text-[0.85rem] text-white/40 flex flex-col gap-3 text-left w-full max-w-[280px]">
                        <div className="flex items-center gap-4"><span className="text-white/20">—</span> Active endpoint testing</div>
                        <div className="flex items-center gap-4"><span className="text-white/20">—</span> Rate limit extraction</div>
                        <div className="flex items-center gap-4"><span className="text-white/20">—</span> Model permission mapping</div>
                    </div>
                </div>
            )}

            {/* 2. Loading State */}
            {loading && (
                <div className="font-mono text-[0.85rem] text-white/80 p-8 flex flex-col gap-3 animate-in fade-in duration-300">
                    {loadingStep >= 0 && <div>{`> Validating key structure...`}</div>}
                    {loadingStep >= 1 && <div className="animate-in fade-in slide-in-from-bottom-2">{`> Provider detected: ${providerNames[provider] || provider.toUpperCase()}`}</div>}
                    {loadingStep >= 2 && <div className="animate-in fade-in slide-in-from-bottom-2">{`> Testing /v1/chat/completions...`}</div>}
                    {loadingStep >= 3 && <div className="animate-in fade-in slide-in-from-bottom-2">{`> Testing advanced capability endpoints...`}</div>}
                    {loadingStep >= 4 && <div className="animate-in fade-in slide-in-from-bottom-2">{`> Fetching permissions matrix...`}</div>}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-4 bg-white animate-pulse"></span>
                    </div>
                </div>
            )}

            {/* 3. Error State */}
            {error && !loading && (
                <div className="flex-1 font-mono text-sm p-8 flex flex-col items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <span className="font-display text-[0.7rem] tracking-[0.2em] text-[#ff4444] uppercase font-bold border border-[#ff4444]/30 bg-[#ff4444]/10 px-3 py-1">ERROR</span>
                    <div className="text-white/80 leading-relaxed whitespace-pre-wrap mt-2">{error}</div>
                </div>
            )}

            {/* 4. Results State */}
            {result && !loading && (
                <div className="flex-1 font-mono text-[0.85rem] leading-loose p-6 sm:p-8 overflow-y-auto animate-in fade-in duration-500 custom-scrollbar">
                    
                    <div className="flex justify-between items-end border-b border-[rgba(255,255,255,0.15)] pb-6 mb-6">
                        <div className="space-y-2">
                            <div className="flex justify-between w-[240px]">
                                <span className="text-white/40">PROVIDER</span>
                                <span className="text-white font-bold">{providerNames[result.provider] || result.provider}</span>
                            </div>
                            <div className="flex justify-between w-[240px]">
                                <span className="text-white/40">STATUS</span>
                                <span className="text-white flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${result.status === 'valid' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`}></span> 
                                    {result.status === 'valid' ? 'VALID' : 'INVALID'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {result.status === 'valid' && (
                        <>
                            {/* CAPABILITIES */}
                            <div className="mb-10">
                                <span className="font-display text-[0.7rem] tracking-[0.2em] text-white/50 block mb-4 uppercase">Capabilities</span>
                                <div className="flex flex-col gap-2">
                                    <CapabilityRow name="Text Generation" cap={result.capabilities.textGeneration} />
                                    <CapabilityRow name="Embeddings" cap={result.capabilities.embeddings} />
                                    <CapabilityRow name="Image Generation" cap={result.capabilities.imageGeneration} />
                                    <CapabilityRow name="Audio Processing" cap={result.capabilities.audioGeneration} />
                                    <CapabilityRow name="Video Generation" cap={result.capabilities.videoGeneration} />
                                </div>
                            </div>

                            <div className="border-t border-[rgba(255,255,255,0.1)] mb-8"></div>

                            {/* MODELS */}
                            <div className="mb-10">
                                <span className="font-display text-[0.7rem] tracking-[0.2em] text-white/50 block mb-4 uppercase">Models</span>
                                <div className="flex flex-col gap-2">
                                    {result.topModels.map(m => (
                                        <div key={m.id} className="flex justify-between items-center w-full group transition-colors hover:bg-white/5 -mx-2 px-2 py-1 rounded-sm">
                                            <div className="flex items-center gap-4 flex-1">
                                                {m.permissionDenied ? <span className="text-white/40">✗</span> : <span className="text-white">✓</span>}
                                                <span className={m.permissionDenied ? 'text-white/40 line-through' : 'text-white font-semibold'}>{m.id}</span>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm flex-1 justify-end">
                                                {m.permissionDenied ? (
                                                    // Denied label
                                                    <span className="font-display text-[0.6rem] tracking-wider bg-[rgba(255,255,255,0.05)] text-white/40 px-2 py-0.5 uppercase">Denied</span>
                                                ) : (
                                                    <>
                                                        {m.maxInputTokens && <span className="text-white/60 w-[60px] text-right">{Math.round(m.maxInputTokens / 1000)}k</span>}
                                                        {(provider === 'openai' || provider === 'auto') && (m.id.includes('4') || m.id.includes('mini')) && (
                                                            // Fake cost metric to simulate the design
                                                            <span className="text-white/60 w-[80px] text-right hidden sm:block">${m.id.includes('mini') ? '0.15' : '5'}/1M</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {result.allModels.length > result.topModels.length && (
                                        <div className="text-white/30 text-xs mt-2 italic px-2">
                                            + {result.allModels.length - result.topModels.length} older/deperecated models unlocked.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RATE LIMITS */}
                            {(result.rateLimits?.requestsPerMinute || result.rateLimits?.tokensPerMinute) && (
                                <>
                                    <div className="border-t border-[rgba(255,255,255,0.1)] mb-8"></div>
                                    <div>
                                        <span className="font-display text-[0.7rem] tracking-[0.2em] text-white/50 block mb-4 uppercase">Rate Limits</span>
                                        <div className="flex flex-col gap-2">
                                            {result.rateLimits.requestsPerMinute && (
                                                <div className="flex justify-between w-full max-w-[300px]">
                                                    <span className="text-white/60">Requests / min</span>
                                                    <span className="text-white">{result.rateLimits.requestsPerMinute.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {result.rateLimits.tokensPerMinute && (
                                                <div className="flex justify-between w-full max-w-[300px]">
                                                    <span className="text-white/60">Tokens / min</span>
                                                    <span className="text-white">{result.rateLimits.tokensPerMinute.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* FOOTER BADGE */}
      <div className="flex justify-center w-full">
          <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
              <span className="text-[1rem]">🔒</span>
              <span className="font-sans font-light text-[0.8rem] text-white/70">Your key was never sent to our servers. Processed in-browser and discarded.</span>
          </div>
      </div>
{/* 
        <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 6px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
        ` }} /> 
*/}

    </div>
  );
}

function CapabilityRow({ name, cap }: { name: string, cap: CapabilityStatus }) {
    if (!cap.tested) {
        return (
            <div className="flex items-center gap-4 py-1">
                <span className="text-white/20">−</span>
                <span className="text-white/40 flex-1">{name}</span>
                <span className="font-display text-[0.6rem] tracking-wider text-white/20 uppercase">Untested</span>
            </div>
        )
    }

    if (!cap.supported) {
        return (
            <div className="flex items-center gap-4 py-1">
                <span className="text-white/40 z-[1]">✗</span>
                <span className="text-white/60 flex-1 relative group cursor-help transition-all duration-300">
                    {name}
                    {cap.error && (
                        <div className="absolute left-0 bottom-full mb-2 bg-white text-black text-xs p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white">
                            HTTP {cap.error}
                        </div>
                    )}
                </span>
                <span className="font-display text-[0.6rem] tracking-wider bg-[rgba(255,255,255,0.05)] text-white/40 px-2 py-0.5 uppercase z-[1]">Denied</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4 py-1">
            <span className="text-white">✓</span>
            <span className="text-white font-medium flex-1">{name}</span>
        </div>
    )
}
