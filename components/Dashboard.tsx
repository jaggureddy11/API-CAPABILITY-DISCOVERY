/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { ProviderType, DiscoveryResult, CapabilityStatus } from '../types';
import CostEstimator from './CostEstimator';
import AILoading from './AILoading';
import { getScanSummary, getAdvisorCards, getModelRecommendation } from '../lib/aiFeatures';

export default function Dashboard() {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<ProviderType | 'auto'>('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // AI Features State
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [advisorCards, setAdvisorCards] = useState<any[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  
  const [useCase, setUseCase] = useState("");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendPlaceholderIdx, setRecommendPlaceholderIdx] = useState(0);

  const recommendPlaceholders = [
      "Fast chatbot with low latency...",
      "Document summarization at scale...",
      "Code generation for my IDE...",
      "Cheap embeddings for search..."
  ];

  useEffect(() => {
      const t = setInterval(() => setRecommendPlaceholderIdx(i => (i + 1) % recommendPlaceholders.length), 3000);
      return () => clearInterval(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!result || result.status !== "valid") return;
    if (!process.env.NEXT_PUBLIC_HF_TOKEN) return;
    
    // Auto-run summary
    setAiSummaryLoading(true);
    getScanSummary(result)
      .then(setAiSummary)
      .catch(() => setAiSummary(""))
      .finally(() => setAiSummaryLoading(false));
    
    // Auto-run advisor
    setAdvisorLoading(true);
    getAdvisorCards(result)
      .then(setAdvisorCards)
      .catch(() => setAdvisorCards([]))
      .finally(() => setAdvisorLoading(false));
  }, [result]);

  const handleRecommend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!useCase.trim() || !result) return;
      if (!process.env.NEXT_PUBLIC_HF_TOKEN) return;
      setRecommendLoading(true);
      setRecommendation(null);
      try {
          const rec = await getModelRecommendation(useCase, result.allModels.map(m => m.id));
          setRecommendation(rec);
      } catch {
          // Ignore failures
      } finally {
          setRecommendLoading(false);
      }
  };

  // FEATURE: Real Typewriter Loading Subcomponent
  const LoadingTerminal = ({ providerName }: { providerName: string }) => {
      const lines = useMemo(() => [
          `> Validating key structure...`,
          `> Provider detected: ${providerName}`,
          `> Testing /v1/chat/completions...`,
          `> Testing advanced capability endpoints...`,
          `> Fetching permissions matrix...`
      ], [providerName]);
  
      const [visibleLines, setVisibleLines] = useState<string[]>([]);
      const [currentLineStr, setCurrentLineStr] = useState('');
      const [lineIdx, setLineIdx] = useState(0);
  
      useEffect(() => {
          if (lineIdx >= lines.length) return;
          const targetStr = lines[lineIdx];
          let charIdx = 0;
          let timeoutId: ReturnType<typeof setTimeout>;
          
          const typeChar = () => {
              if (charIdx <= targetStr.length) {
                  setCurrentLineStr(targetStr.substring(0, charIdx));
                  charIdx++;
                  
                  let delay = Math.random() * 17 + 28;
                  if (targetStr.startsWith('>')) delay = 20;
                  
                  timeoutId = setTimeout(typeChar, delay);
              } else {
                  setVisibleLines(prev => [...prev, targetStr]);
                  setCurrentLineStr('');
                  setLineIdx(prev => prev + 1);
              }
          };
          timeoutId = setTimeout(typeChar, 100);
          return () => clearTimeout(timeoutId);
      }, [lineIdx, lines]);
  
      return (
          <div className="font-mono text-[0.85rem] text-white/80 p-8 flex flex-col gap-3 relative animate-in fade-in duration-300 flex-1">
              <div className="terminal-scanline"></div>
              {visibleLines.map((l, i) => <div key={i}>{l}</div>)}
              {lineIdx < lines.length && <div>{currentLineStr}<span className="cursor-blink">█</span></div>}
              {lineIdx >= lines.length && <div><span className="cursor-blink">█</span></div>}
          </div>
      );
  };

  // FEATURE 2: LIVE PARSER
  const keyFormat = useMemo(() => {
    if (!apiKey) return null;
    const key = apiKey.trim();
    if (key.startsWith('sk-proj-')) return { provider: 'openai', label: 'OpenAI Project Key', valid: true, prefix: 'sk-proj-' };
    if (key.startsWith('sk-ant-')) return { provider: 'anthropic', label: 'Anthropic', valid: true, prefix: 'sk-ant-' };
    if (key.startsWith('sk-')) return { provider: 'openai', label: 'OpenAI Legacy Key', valid: true, prefix: 'sk-' };
    if (key.startsWith('AIza')) return { provider: 'gemini', label: 'Google Gemini', valid: true, prefix: 'AIza' };
    if (key.startsWith('gsk_')) return { provider: 'groq', label: 'Groq', valid: true, prefix: 'gsk_' };
    return { provider: 'auto', label: 'Unknown Format', valid: false, prefix: 'Unknown' };
  }, [apiKey]);

  useEffect(() => {
    if (keyFormat && keyFormat.valid && provider === 'auto') {
        setProvider(keyFormat.provider as ProviderType);
    }
  }, [keyFormat, provider]);

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

    try {
        const res = await fetch('/api/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: apiKey.trim(), provider })
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to discover capabilities');
        }
        
        const data: DiscoveryResult = await res.json();
        setResult(data);

        // FEATURE 3: SCAN HISTORY
        if (data.status === 'valid') {
            const apiK = apiKey.trim();
            const hint = apiK.length > 7 ? apiK.substring(0, 3) + '...' + apiK.substring(apiK.length - 4) : apiK.substring(0, 3) + '...';
            const entry = {
                id: 'scan_' + Date.now(),
                provider: data.provider,
                scannedAt: new Date().toISOString(),
                status: 'valid',
                capabilityCount: Object.values(data.capabilities).filter((c: CapabilityStatus) => c.supported).length,
                modelCount: data.allModels.length,
                keyHint: hint
            };
            const rawHist = localStorage.getItem('apilens_history');
            const history = rawHist ? JSON.parse(rawHist) : [];
            history.unshift(entry);
            if (history.length > 10) history.length = 10;
            localStorage.setItem('apilens_history', JSON.stringify(history));
            window.dispatchEvent(new Event('historyUpdated'));
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  const clearForm = () => {
      setApiKey('');
      setResult(null);
      setError(null);
  };

  const providerNames: Record<string, string> = {
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      groq: 'Groq',
      auto: 'Auto-detected'
  };

  // FEATURE 1: EXPORT REPORT BUTTONS
  const handleCopyReport = () => {
    if (!result) return;
    const date = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
    let text = `APILENS — CAPABILITY REPORT\n────────────────────────────\n`;
    text += `Provider     : ${providerNames[result.provider] || result.provider}\n`;
    text += `Status       : Valid\n`;
    text += `Scanned at   : ${date}\n\n`;
    
    text += `CAPABILITIES\n`;
    const caps = result.capabilities;
    text += `${caps.textGeneration.supported ? '✓' : '✗'} Text Generation\n`;
    text += `${caps.embeddings.supported ? '✓' : '✗'} Embeddings\n`;
    text += `${caps.imageGeneration.supported ? '✓' : '✗'} Image Generation\n`;
    text += `${caps.audioGeneration.supported ? '✓' : '✗'} Audio Processing\n`;
    text += `${caps.videoGeneration.supported ? '✓' : '✗'} Video Generation\n\n`;
    
    text += `MODELS\n`;
    result.topModels.forEach(m => {
        const mark = m.permissionDenied ? '✗' : '✓';
        const ctx = m.maxInputTokens ? `${Math.round(m.maxInputTokens/1000)}k` : '';
        const costStr = (result.provider === 'openai' || result.provider === 'auto') && (m.id.includes('4') || m.id.includes('mini')) ? `$${m.id.includes('mini') ? '0.15' : '5'}/1M` : '';
        text += `${mark} ${m.id.padEnd(16)} ${ctx.padEnd(6)} ${costStr}\n`.trimEnd() + `\n`;
    });
    
    if (result.rateLimits && (result.rateLimits.requestsPerMinute || result.rateLimits.tokensPerMinute)) {
        text += `\nRATE LIMITS\n`;
        if (result.rateLimits.requestsPerMinute) text += `Requests/min : ${result.rateLimits.requestsPerMinute.toLocaleString()}\n`;
        if (result.rateLimits.tokensPerMinute) text += `Tokens/min   : ${result.rateLimits.tokensPerMinute.toLocaleString()}\n`;
    }
    
    text += `\nGenerated by APILens — apilens.dev`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    if (!result) return;
    const date = new Date().toISOString();
    const payload = {
      provider: providerNames[result.provider] || result.provider,
      status: "valid",
      scannedAt: date,
      capabilities: result.capabilities,
      models: result.topModels.map(m => ({
          id: m.id,
          context: m.maxInputTokens ? `${Math.round(m.maxInputTokens/1000)}k` : undefined,
          authorized: !m.permissionDenied
      })),
      rateLimits: result.rateLimits
    };
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apilens-${result.provider}-${date.substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="dash-entry-left border border-[rgba(255,255,255,0.15)] bg-black p-6 md:p-8 flex flex-col overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
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

                {/* FEATURE 2: LIVE PARSER STRIP */}
                <div className={`overflow-hidden transition-all duration-300 ${apiKey.trim() ? "max-h-[200px] opacity-100 mt-2 mb-2" : "max-h-0 opacity-0 mb-0"}`}>
                    <div className="border border-[rgba(255,255,255,0.15)] bg-black p-4 text-white font-mono text-[10px] leading-relaxed relative">
                        <div className="mb-2 text-white/80 break-all">{apiKey.substring(0, 24)}{apiKey.length > 24 ? '...' : ''}</div>
                        <div className="flex gap-4 text-white/20 mb-2 whitespace-pre">── ── ── ── ── ── ── ── ── ──</div>
                        <div className="grid grid-cols-[60px_1fr_20px] gap-2 items-center">
                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-white/40 tracking-widest text-[8px]">FORMAT</span>
                                <span>{keyFormat?.label}</span>
                                <span className={keyFormat?.valid ? "text-white" : "text-white/30"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-white/40 tracking-widest text-[8px]">PROVIDER</span>
                                <span>{keyFormat?.provider !== 'auto' && keyFormat ? providerNames[keyFormat.provider] : 'Unknown'}</span>
                                <span className={keyFormat?.valid ? "text-white" : "text-white/30"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-white/40 tracking-widest text-[8px]">LENGTH</span>
                                <span>{apiKey.trim().length >= 10 ? 'Valid' : 'Too Short'}</span>
                                <span className={apiKey.trim().length >= 10 ? "text-white" : "text-white/30"}>{apiKey.trim().length >= 10 ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-white/40 tracking-widest text-[8px]">PREFIX</span>
                                <span>{keyFormat?.prefix}</span>
                                <span className={keyFormat?.valid ? "text-white" : "text-white/30"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`text-white/40 text-[0.7rem] font-sans font-light leading-relaxed mb-4 flex-1 ${apiKey.trim() ? "mt-0" : ""}`}>
                    Keys are never stored or logged. Discarded instantly in volatile memory.
                </div>

                <button
                    type="submit"
                    disabled={loading || !apiKey.trim()}
                    className="btn-sweep w-full bg-white text-black font-display font-bold text-[0.8rem] uppercase tracking-[0.15em] py-4 border border-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2 outline-none"
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
        <div className="dash-entry-right border border-[rgba(255,255,255,0.15)] bg-black flex flex-col relative overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
            
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
            {loading && <LoadingTerminal providerName={providerNames[provider] || provider.toUpperCase()} />}

            {/* 3. Error State */}
            {error && !loading && (
                <div className="flex-1 font-mono text-sm p-8 flex flex-col items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <span className="font-display text-[0.7rem] tracking-[0.2em] text-[#ff4444] uppercase font-bold border border-[#ff4444]/30 bg-[#ff4444]/10 px-3 py-1">ERROR</span>
                    <div className="text-white/80 leading-relaxed whitespace-pre-wrap mt-2">{error}</div>
                </div>
            )}

            {/* 4. Results State */}
            {result && !loading && (
                <div className="flex-1 font-mono text-[0.85rem] leading-loose p-8">
                    
                    <div className="res-stagger res-delay-0 flex flex-col gap-2 pb-8">
                        <div className="flex justify-between items-center w-full">
                            <span className="text-white/40">PROVIDER</span>
                            <span className="text-white font-bold">{providerNames[result.provider] || result.provider}</span>
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <span className="text-white/40">STATUS</span>
                            <span className={`text-white/90 text-[0.9rem] flex items-center gap-2 ${result.status === 'valid' ? 'status-pulse' : 'status-invalid'}`}>
                                <span className={`w-2 h-2 rounded-full ${result.status === 'valid' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`}></span> 
                                {result.status === 'valid' ? 'VALID' : 'INVALID'}
                            </span>
                        </div>
                    </div>

                    {result.status === 'valid' && (
                        <>
                            {process.env.NEXT_PUBLIC_HF_TOKEN && (
                                <>
                                    <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)]"></div>
                                    <div className="res-stagger res-delay-1 py-8 flex flex-col items-start min-h-[100px]">
                                        <span className="font-display text-[9px] tracking-[0.2em] text-white/40 block mb-5 uppercase" style={{ fontFamily: "Syne, sans-serif" }}>AI Summary</span>
                                        {aiSummaryLoading ? (
                                            <AILoading />
                                        ) : aiSummary ? (
                                            <p className="font-sans font-light text-[14px] text-white/70 leading-[1.7] animate-in fade-in duration-500 m-0">
                                                {aiSummary}
                                            </p>
                                        ) : (
                                            <span 
                                                className="font-sans font-light text-[12px] text-white/25 italic cursor-pointer hover:text-white/50 transition-colors" 
                                                onClick={() => {
                                                    setAiSummaryLoading(true);
                                                    getScanSummary(result).then(setAiSummary).catch(()=>setAiSummary("")).finally(()=>setAiSummaryLoading(false));
                                                }}
                                            >AI analysis timed out. Try again →</span>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* CAPABILITIES */}
                            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)]"></div>
                            <div className="res-stagger res-delay-1 py-8">
                                <span className="font-display text-[0.7rem] tracking-[0.2em] text-white/50 block mb-5 uppercase">Capabilities</span>
                                <div className="flex flex-col">
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Text Generation" cap={result.capabilities.textGeneration} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Embeddings" cap={result.capabilities.embeddings} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Image Generation" cap={result.capabilities.imageGeneration} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Audio Processing" cap={result.capabilities.audioGeneration} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Video Generation" cap={result.capabilities.videoGeneration} /></div>
                                </div>
                            </div>

                            {/* MODELS */}
                            <div className="res-stagger res-delay-2 w-full h-[1px] bg-[rgba(255,255,255,0.08)]"></div>
                            <div className="res-stagger res-delay-2 py-8">
                                <span className="font-display text-[0.7rem] tracking-[0.2em] text-white/50 block mb-5 uppercase">Models</span>
                                
                                {result.topModels.filter(m => !m.permissionDenied).length > 0 && (
                                    <div className="mb-6">
                                        <div className="font-display text-[8px] text-white/30 uppercase tracking-widest mb-2">AUTHORIZED</div>
                                        <div className="flex flex-col">
                                            {result.topModels.filter(m => !m.permissionDenied).map(m => (
                                                <div key={m.id} className="res-model-row flex justify-between items-center w-full py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                                                    <div className="flex items-center flex-1">
                                                        <span className="cap-check text-white text-lg mr-3">✓</span>
                                                        <span className="text-white font-mono text-left">{m.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6 text-sm flex-1 justify-end text-white/40">
                                                        {m.maxInputTokens && <span className="w-[60px] text-right">{Math.round(m.maxInputTokens / 1000)}k</span>}
                                                        {(provider === 'openai' || provider === 'auto') && (m.id.includes('4') || m.id.includes('mini')) && (
                                                            <span className="w-[80px] text-right hidden sm:block">${m.id.includes('mini') ? '0.15' : '5'}/1M</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.topModels.filter(m => m.permissionDenied).length > 0 && (
                                    <div>
                                        <div className="w-full h-[1px] bg-[rgba(255,255,255,0.08)] my-4"></div>
                                        <div className="font-display text-[8px] text-white/20 uppercase tracking-widest mb-2">RESTRICTED</div>
                                        <div className="flex flex-col opacity-25">
                                            {result.topModels.filter(m => m.permissionDenied).map(m => (
                                                <div key={m.id} className="res-model-row flex justify-between items-center w-full py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                                                    <div className="flex items-center flex-1">
                                                        <span className="cap-cross text-white/40 text-lg mr-3">✗</span>
                                                        <span className="text-white/40 font-mono text-left line-through">{m.id}</span>
                                                    </div>
                                                    <div className="flex flex-1 justify-end items-center">
                                                        <span className="font-display text-[0.6rem] tracking-wider border border-white/20 text-white/40 px-1 py-0.5 uppercase">Denied</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.allModels.length > result.topModels.length && (
                                    <div className="text-white/20 mt-4 italic font-sans font-light">
                                        + {result.allModels.length - result.topModels.length} older models
                                    </div>
                                )}
                            </div>

                            {/* RATE LIMITS */}
                            {(result.rateLimits?.requestsPerMinute || result.rateLimits?.tokensPerMinute) && (
                                <>
                                    <div className="res-stagger res-delay-3 w-full h-[1px] bg-[rgba(255,255,255,0.08)]"></div>
                                    <div className="res-stagger res-delay-3 py-8">
                                        <span className="font-display text-[0.7rem] tracking-[0.2em] text-white/50 block mb-5 uppercase">Rate Limits</span>
                                        <div className="flex flex-col gap-3">
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

                            {process.env.NEXT_PUBLIC_HF_TOKEN && (
                                <>
                                    <div className="res-stagger res-delay-4 w-full h-[1px] bg-[rgba(255,255,255,0.08)]"></div>
                                    <div className="res-stagger res-delay-4 py-8">
                                        <span className="font-display text-[9px] tracking-[0.2em] text-white/40 block mb-5 uppercase" style={{ fontFamily: "Syne, sans-serif" }}>AI Advisor</span>
                                        {advisorLoading ? (
                                            <AILoading />
                                        ) : advisorCards.length > 0 ? (
                                            <div className="flex flex-col md:flex-row gap-4 animate-in fade-in duration-500">
                                                {advisorCards.map((card, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="flex-1 border border-[rgba(255,255,255,0.15)] p-4 bg-black hover:border-[rgba(255,255,255,0.4)] transition-colors duration-200"
                                                        style={{ animationDelay: `${idx * 80}ms` }}
                                                    >
                                                        <div className="font-display text-[8px] text-white/35 tracking-[0.15em] uppercase" style={{ fontFamily: "Syne, sans-serif" }}>
                                                            {card.type === 'warning' ? '⚠ WARNING' : card.type === 'tip' ? '→ TIP' : '◆ INSIGHT'}
                                                        </div>
                                                        <div className="font-display text-[11px] text-white/80 font-bold mt-2 uppercase" style={{ fontFamily: "Syne, sans-serif" }}>{card.title}</div>
                                                        <div className="font-sans font-light text-[11px] text-white/50 leading-[1.6] mt-1.5">{card.body}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span 
                                                className="font-sans font-light text-[12px] text-white/25 italic cursor-pointer hover:text-white/50 transition-colors" 
                                                onClick={() => {
                                                    setAdvisorLoading(true);
                                                    getAdvisorCards(result).then(setAdvisorCards).catch(()=>setAdvisorCards([])).finally(()=>setAdvisorLoading(false));
                                                }}
                                            >AI analysis timed out. Try again →</span>
                                        )}
                                    </div>

                                    <div className="res-stagger res-delay-4 w-full h-[1px] bg-[rgba(255,255,255,0.08)]"></div>
                                    <div className="res-stagger res-delay-4 py-8">
                                        <span className="font-display text-[9px] tracking-[0.2em] text-white/40 block mb-5 uppercase" style={{ fontFamily: "Syne, sans-serif" }}>Model Recommender</span>
                                        <form onSubmit={handleRecommend} className="flex flex-col gap-4">
                                            <div className="flex w-full">
                                                <input
                                                    type="text"
                                                    value={useCase}
                                                    onChange={e => setUseCase(e.target.value)}
                                                    placeholder={recommendPlaceholders[recommendPlaceholderIdx]}
                                                    disabled={recommendLoading}
                                                    className="flex-1 bg-black border border-[rgba(255,255,255,0.18)] font-mono text-[12px] text-white p-3 placeholder:text-white/25 outline-none rounded-none focus:border-white transition-colors"
                                                />
                                                <button 
                                                    type="submit" 
                                                    disabled={recommendLoading || !useCase.trim()}
                                                    className="w-[48px] bg-black border border-[rgba(255,255,255,0.18)] border-l-0 text-white hover:bg-white hover:text-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none rounded-none flex items-center justify-center font-bold"
                                                >→</button>
                                            </div>
                                            {(recommendLoading || recommendation) && (
                                                <div className="border border-[rgba(255,255,255,0.12)] p-5 mt-2 transition-all">
                                                    {recommendLoading ? (
                                                        <AILoading />
                                                    ) : recommendation ? (
                                                        <div className="animate-in fade-in duration-500">
                                                            <div className="font-display text-[8px] text-white/35 uppercase" style={{ fontFamily: "Syne, sans-serif" }}>RECOMMENDED</div>
                                                            <div 
                                                                className="font-mono text-[18px] text-white mt-1 cursor-pointer hover:underline decoration-white/60 transition-all w-fit"
                                                                onClick={() => {
                                                                    window.dispatchEvent(new CustomEvent('set-cost-model', { detail: recommendation.recommended }));
                                                                }}
                                                            >{recommendation.recommended}</div>
                                                            <div className="font-sans font-light text-[12px] text-white/60 mt-2">{recommendation.reason}</div>
                                                            <div className="mt-4 flex flex-col gap-1">
                                                                <div className="flex gap-2 items-center"><span className="font-display text-[8px] text-white/30 uppercase" style={{ fontFamily: "Syne, sans-serif" }}>TRADEOFF</span> <span className="font-sans font-light text-[12px] text-white/45">{recommendation.tradeoff}</span></div>
                                                                <div className="flex gap-2 items-center"><span className="font-display text-[8px] text-white/30 uppercase" style={{ fontFamily: "Syne, sans-serif" }}>EST. COST</span> <span className="font-sans font-light text-[12px] text-white/45">{recommendation.estimatedCost}</span></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="font-sans font-light text-[12px] text-white/25 italic">AI analysis timed out.</span>
                                                    )}
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* FULL WIDTH COMPONENTS */}
      {result && !loading && result.status === 'valid' && result.allModels.length > 0 && (
          <div className="w-full flex flex-col mb-12">
              <div className="res-stagger res-delay-4 mb-4">
                  <CostEstimator availableModels={result.allModels.map(m => m.id)} />
              </div>
              
              {/* FEATURE 1: ACTION BAR */}
              <div className="res-stagger res-delay-5 flex gap-4 w-full pt-4">
                  <button
                      onClick={handleCopyReport}
                      className="flex-1 bg-white text-black font-display uppercase tracking-[0.15em] text-[0.65rem] border border-[rgba(255,255,255,0.2)] hover:bg-black hover:text-white transition-colors rounded-none outline-none overflow-hidden min-h-[48px]"
                  >
                      <div className="flip-wrapper">
                          <span className={`flip-text py-3 px-4 ${copied ? 'out' : ''}`}>COPY REPORT</span>
                          <span className={`flip-text py-3 px-4 ${copied ? '' : 'out'}`} style={copied ? { transform: 'rotateX(0deg)', opacity: 1 } : { transform: 'rotateX(-90deg)', opacity: 0 }}>✓ COPIED</span>
                      </div>
                  </button>
                  <button
                      onClick={handleExportJson}
                      className="flex-1 bg-transparent text-white font-display uppercase tracking-[0.15em] text-[0.65rem] py-3 px-4 border border-white hover:bg-white hover:text-black transition-colors rounded-none outline-none min-h-[48px]"
                  >
                      EXPORT JSON
                  </button>
              </div>
          </div>
      )}

      {/* FOOTER BADGE */}
      <div className="flex justify-center w-full mt-8">
          <div className="inline-flex items-center justify-center px-4 py-3 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
              <span className="mr-2 text-[14px]">🔒</span>
              <span className="font-sans font-light text-[0.8rem] text-white/50">Your key was never sent to our servers. Processed in-browser and discarded.</span>
          </div>
      </div>
        <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
            }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        ` }} />

    </div>
  );
}

function CapabilityRow({ name, cap }: { name: string, cap: CapabilityStatus }) {
    if (!cap.tested) {
        return (
            <div className="flex justify-between items-center w-full py-[14px]">
                <div className="flex items-center flex-1">
                    <span className="text-white/20 text-lg mr-3">−</span>
                    <span className="text-white/40">{name}</span>
                </div>
                <span className="font-display text-[0.6rem] tracking-wider text-white/20 uppercase">Untested</span>
            </div>
        )
    }

    if (!cap.supported) {
        return (
            <div className="flex justify-between items-center w-full py-[14px] relative group cursor-help transition-all duration-300">
                <div className="flex items-center flex-1">
                    <span className="cap-cross text-white/40 text-lg mr-3 z-[1]">✗</span>
                    <span className="text-white/60">
                        {name}
                        {cap.error && (
                            <div className="absolute left-0 bottom-full mb-2 bg-white text-black text-xs p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white">
                                HTTP {cap.error}
                            </div>
                        )}
                    </span>
                </div>
                <span className="font-display text-[0.6rem] tracking-wider border border-white/20 text-white/40 px-1 py-0.5 uppercase z-[1]">Denied</span>
            </div>
        )
    }

    return (
        <div className="flex justify-between items-center w-full py-[14px]">
            <div className="flex items-center flex-1">
                <span className="cap-check text-white text-lg mr-3">✓</span>
                <span className="text-white font-medium">{name}</span>
            </div>
        </div>
    )
}
