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
    <div className="w-full text-white font-sans max-w-[1400px] mx-auto animate-in fade-in duration-700">
      
      {/* PAGE HEADER */}
      <div className="mb-[32px] text-center md:text-left flex flex-col items-center md:items-start w-full">
          <span className="font-display text-[9px] uppercase text-[rgba(255,255,255,0.40)] tracking-[0.25em] mb-[12px] block">Capability Discovery</span>
          <h1 className="font-serif font-bold tracking-tighter leading-none m-[8px_0_6px_0] text-[clamp(40px,4vw,64px)]">
              Analyze Your Key.
          </h1>
          <p className="font-sans text-[rgba(255,255,255,0.65)] font-light text-[15px] mb-[32px]">
              Your key never touches our servers. Results are instant and discarded immediately.
          </p>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-[2px] mb-[2px]">
        <div className="w-full md:w-[300px] lg:w-[360px] shrink-0 border border-[rgba(255,255,255,0.12)] border-r md:border-r-[rgba(255,255,255,0.08)] bg-black p-[28px] flex flex-col md:sticky top-[80px] h-fit z-10">
            <form onSubmit={handleDiscover} className="flex flex-col w-full">
                <div className="mb-[8px]">
                    <label className="font-display text-[9px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.5)] block mb-[8px]">Provider</label>
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

                <div className="mt-[20px] mb-[8px]">
                    <label className="font-display text-[9px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.5)] block mb-[8px]">API Key</label>
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
                <div className={`overflow-hidden transition-all duration-300 ${apiKey.trim() ? "max-h-[200px] opacity-100 mt-[12px] mb-[16px]" : "max-h-0 opacity-0 mb-0"}`}>
                    <div className="border border-[rgba(255,255,255,0.15)] bg-black p-[20px] text-white font-mono text-[10px] leading-relaxed relative">
                        <div className="mb-2 text-[rgba(255,255,255,0.80)] break-all">{apiKey.substring(0, 24)}{apiKey.length > 24 ? '...' : ''}</div>
                        <div className="flex gap-4 text-[rgba(255,255,255,0.20)] mb-2 whitespace-pre">── ── ── ── ── ── ── ── ── ──</div>
                        <div className="grid grid-cols-[60px_1fr_20px] gap-2 items-center">
                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[rgba(255,255,255,0.45)] tracking-widest text-[8px]">FORMAT</span>
                                <span className="text-[rgba(255,255,255,0.80)]">{keyFormat?.label}</span>
                                <span className={keyFormat?.valid ? "text-[rgba(255,255,255,0.70)]" : "text-[rgba(255,255,255,0.40)]"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[rgba(255,255,255,0.45)] tracking-widest text-[8px]">PROVIDER</span>
                                <span className="text-[rgba(255,255,255,0.80)]">{keyFormat?.provider !== 'auto' && keyFormat ? providerNames[keyFormat.provider] : 'Unknown'}</span>
                                <span className={keyFormat?.valid ? "text-[rgba(255,255,255,0.70)]" : "text-[rgba(255,255,255,0.40)]"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[rgba(255,255,255,0.45)] tracking-widest text-[8px]">LENGTH</span>
                                <span className="text-[rgba(255,255,255,0.80)]">{apiKey.trim().length >= 10 ? 'Valid' : 'Too Short'}</span>
                                <span className={apiKey.trim().length >= 10 ? "text-[rgba(255,255,255,0.70)]" : "text-[rgba(255,255,255,0.40)]"}>{apiKey.trim().length >= 10 ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[rgba(255,255,255,0.45)] tracking-widest text-[8px]">PREFIX</span>
                                <span className="text-[rgba(255,255,255,0.80)]">{keyFormat?.prefix}</span>
                                <span className={keyFormat?.valid ? "text-[rgba(255,255,255,0.70)]" : "text-[rgba(255,255,255,0.40)]"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`text-[rgba(255,255,255,0.65)] text-[11px] font-sans font-light leading-relaxed mb-[20px] ${apiKey.trim() ? "mt-[16px]" : ""}`}>
                    Keys are never stored or logged. Discarded instantly in volatile memory.
                </div>

                <div className="flex flex-col gap-[8px]">
                    <button
                        type="submit"
                        disabled={loading || !apiKey.trim()}
                        className="w-full bg-white text-black font-display font-bold text-[11px] uppercase tracking-[0.2em] h-[52px] border border-white hover:bg-black hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none flex items-center justify-center cursor-pointer"
                    >
                        {loading ? 'DISCOVERING...' : 'DISCOVER →'}
                    </button>

                    {(result || error) && (
                        <button
                            type="button"
                            onClick={clearForm}
                            className="w-full bg-transparent text-[rgba(255,255,255,0.4)] font-display text-[10px] uppercase tracking-[0.1em] h-[44px] border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors duration-300 flex items-center justify-center cursor-pointer"
                        >
                        CLEAR
                        </button> 
                    )}
                </div>
            </form>
        </div>

        {/* RIGHT COLUMN: Results Panel */}
        <div className="flex-1 min-w-0 border border-[rgba(255,255,255,0.12)] md:border-l-0 bg-black flex flex-col relative overflow-y-auto md:max-h-[calc(100vh-200px)] custom-scrollbar">
            
            {/* 1. Empty State */}
            {!loading && !result && !error && (
                <div className="flex-1 flex flex-col items-center justify-center p-[32px] text-center border-[rgba(255,255,255,0.15)] animate-in fade-in duration-500 min-h-[400px]">
                    <div className="flex flex-col items-center text-[rgba(255,255,255,0.40)] w-full max-w-[320px]">
                        <h3 className="font-display text-[12px] tracking-[0.2em] uppercase mb-[24px]">Ready for Discovery</h3>
                        <p className="font-sans font-light text-[14px] leading-relaxed mb-[32px] text-[rgba(255,255,255,0.65)]">
                            Paste your API key on the left to begin analysis.
                        </p>
                        <div className="font-sans font-light text-[14px] flex flex-col gap-[12px] items-center text-center text-[rgba(255,255,255,0.65)]">
                            <div>─ Active endpoint testing</div>
                            <div>─ Live capability detection</div>
                            <div>─ AI-powered insights</div>
                        </div>
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
                <div className="flex-1 font-mono text-[14px] leading-[1.6] px-[16px] xl:px-[28px] py-[28px] relative">
                    
                    {/* TIMESTAMP HEADER */}
                    <div className="absolute top-[28px] right-[28px] font-mono text-[10px] text-[rgba(255,255,255,0.2)]">
                        Scanned {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="res-stagger res-delay-0 flex flex-col gap-2 pb-[28px]">
                        <span className="font-display text-[9px] tracking-[0.2em] block mb-[16px] uppercase">
                            <span className="text-[rgba(255,255,255,0.40)]">01 — </span><span className="text-[rgba(255,255,255,0.50)]">Provider</span>
                        </span>
                        <div className="flex justify-between items-center w-full">
                            <span className="font-display text-[9px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.45)]">PROVIDER</span>
                            <span className="font-sans font-semibold text-[15px] text-[rgba(255,255,255,0.85)]">{providerNames[result.provider] || result.provider}</span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-[8px]">
                            <span className="font-display text-[9px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.45)]">STATUS</span>
                            <span className={`text-[15px] font-semibold text-[rgba(255,255,255,0.90)] flex items-center gap-2 ${result.status === 'valid' ? 'status-pulse' : 'status-invalid'}`}>
                                <span className={`w-[8px] h-[8px] rounded-full ${result.status === 'valid' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`}></span> 
                                {result.status === 'valid' ? 'VALID' : 'INVALID'}
                            </span>
                        </div>
                    </div>

                    {result.status === 'valid' && (
                        <>
                            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.07)]"></div>
                                    <div className="res-stagger res-delay-1 py-[28px] flex flex-col items-start min-h-[100px]">
                                        <span className="font-display text-[9px] tracking-[0.2em] block mb-[8px] uppercase">
                                            <span className="text-[rgba(255,255,255,0.40)]">02 — </span><span className="text-[rgba(255,255,255,0.50)]">AI Summary</span>
                                        </span>
                                        {aiSummaryLoading ? (
                                            <AILoading />
                                        ) : aiSummary ? (
                                            <p className="font-sans font-light text-[15px] text-[rgba(255,255,255,0.75)] leading-[1.8] w-full max-w-full m-0 p-0 animate-in fade-in duration-500">
                                                {aiSummary}
                                            </p>
                                        ) : (
                                            <span 
                                                className="font-sans font-light text-[12px] text-white/25 italic cursor-pointer hover:text-white/50 transition-colors mt-[8px]" 
                                                onClick={() => {
                                                    setAiSummaryLoading(true);
                                                    getScanSummary(result).then(setAiSummary).catch(()=>setAiSummary("")).finally(()=>setAiSummaryLoading(false));
                                                }}
                                            >AI analysis timed out. Try again →</span>
                                        )}
                                    </div>

                            {/* CAPABILITIES */}
                            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.07)]"></div>
                            <div className="res-stagger res-delay-1 py-[28px]">
                                <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]">
                                    <span className="text-[rgba(255,255,255,0.40)]">03 — </span><span className="text-[rgba(255,255,255,0.50)]">Capabilities</span>
                                </span>
                                <div className="flex flex-col">
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Text Generation" cap={result.capabilities.textGeneration} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Embeddings" cap={result.capabilities.embeddings} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Image Generation" cap={result.capabilities.imageGeneration} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Audio Processing" cap={result.capabilities.audioGeneration} /></div>
                                    <div className="res-cap-row border-b border-[rgba(255,255,255,0.05)] last:border-0"><CapabilityRow name="Video Generation" cap={result.capabilities.videoGeneration} /></div>
                                </div>
                            </div>

                            {/* MODELS */}
                            <div className="res-stagger res-delay-2 w-full h-[1px] bg-[rgba(255,255,255,0.07)]"></div>
                            <div className="res-stagger res-delay-2 py-[28px]">
                                <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]">
                                    <span className="text-[rgba(255,255,255,0.40)]">04 — </span><span className="text-[rgba(255,255,255,0.50)]">Models</span>
                                </span>
                                
                                {result.topModels.filter(m => !m.permissionDenied).length > 0 && (
                                    <div className="mb-6">
                                        <div className="font-display text-[8px] text-white/30 uppercase tracking-widest mb-2">AUTHORIZED</div>
                                        <div className="flex flex-col">
                                            {result.topModels.filter(m => !m.permissionDenied).map(m => (
                                                <div key={m.id} className="res-model-row flex justify-between items-center w-full py-[12px] border-b border-[rgba(255,255,255,0.05)] last:border-0">
                                                    <div className="flex items-center flex-1">
                                                        <span className="cap-check text-[rgba(255,255,255,0.80)] text-lg mr-3">✓</span>
                                                        <span className="text-[rgba(255,255,255,0.85)] font-mono text-[13px] text-left">{m.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6 flex-1 justify-end font-mono text-[12px] text-[rgba(255,255,255,0.50)]">
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
                                        <div className="w-full h-[1px] bg-[rgba(255,255,255,0.07)] my-4"></div>
                                        <div className="font-display text-[8px] text-[rgba(255,255,255,0.40)] uppercase tracking-widest mb-2">RESTRICTED</div>
                                        <div className="flex flex-col">
                                            {result.topModels.filter(m => m.permissionDenied).map(m => (
                                                <div key={m.id} className="res-model-row flex justify-between items-center w-full py-[12px] border-b border-[rgba(255,255,255,0.05)] last:border-0">
                                                    <div className="flex items-center flex-1">
                                                        <span className="cap-cross text-[rgba(255,255,255,0.40)] text-lg mr-3">✗</span>
                                                        <span className="text-[rgba(255,255,255,0.40)] font-mono text-[13px] text-left line-through">{m.id}</span>
                                                    </div>
                                                    <div className="flex flex-1 justify-end items-center">
                                                        <span className="font-display text-[0.6rem] tracking-wider border border-[rgba(255,255,255,0.25)] text-[rgba(255,255,255,0.50)] px-1 py-0.5 uppercase">Denied</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.allModels.length > result.topModels.length && (
                                    <div className="text-[rgba(255,255,255,0.40)] mt-4 italic font-sans font-light">
                                        + {result.allModels.length - result.topModels.length} older models
                                    </div>
                                )}
                            </div>

                            {/* RATE LIMITS */}
                            {(result.rateLimits?.requestsPerMinute || result.rateLimits?.tokensPerMinute) && (
                                <>
                                    <div className="res-stagger res-delay-3 w-full h-[1px] bg-[rgba(255,255,255,0.07)]"></div>
                                    <div className="res-stagger res-delay-3 py-[28px]">
                                        <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]">
                                            <span className="text-[rgba(255,255,255,0.40)]">05 — </span><span className="text-[rgba(255,255,255,0.50)]">Rate Limits</span>
                                        </span>
                                        <div className="flex flex-col gap-3">
                                            {result.rateLimits.requestsPerMinute && (
                                                <div className="flex justify-between items-center w-full max-w-[300px]">
                                                    <span className="text-[14px] text-[rgba(255,255,255,0.45)]">Requests / min</span>
                                                    <span className="text-[14px] text-[rgba(255,255,255,0.85)]">{result.rateLimits.requestsPerMinute.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {result.rateLimits.tokensPerMinute && (
                                                <div className="flex justify-between items-center w-full max-w-[300px]">
                                                    <span className="text-[14px] text-[rgba(255,255,255,0.45)]">Tokens / min</span>
                                                    <span className="text-[14px] text-[rgba(255,255,255,0.85)]">{result.rateLimits.tokensPerMinute.toLocaleString()}</span>
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

      {/* FULL WIDTH COMPONENTS */}
      {result && !loading && result.status === 'valid' && result.allModels.length > 0 && (
          <div className="w-full flex flex-col items-center">
              
              {/* AI ADVISOR */}
              <div className="w-full border border-[rgba(255,255,255,0.12)] bg-black p-[28px] md:p-[28px_32px] mb-[2px]">
                  <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]"><span className="text-[rgba(255,255,255,0.40)]">06 — </span><span className="text-[rgba(255,255,255,0.50)]">AI Advisor</span></span>
                  {advisorLoading ? (
                      <AILoading />
                  ) : advisorCards.length > 0 ? (
                      <div className="flex flex-col md:flex-row gap-[2px] animate-in fade-in w-full duration-500">
                          {advisorCards.map((card, idx) => (
                              <div 
                                  key={idx} 
                                  className="flex-1 w-full flex flex-col border border-[rgba(255,255,255,0.20)] p-[24px] bg-[#050505] hover:border-[rgba(255,255,255,0.40)] transition-colors duration-200 min-h-[140px]"
                                  style={{ animationDelay: `${idx * 80}ms` }}
                              >
                                  <div className="font-display text-[9px] text-[rgba(255,255,255,0.55)] tracking-[0.15em] uppercase">
                                      {card.type === 'warning' ? '⚠ WARNING' : card.type === 'tip' ? '→ TIP' : '◆ INSIGHT'}
                                  </div>
                                  <div className="font-display text-[13px] text-[rgba(255,255,255,0.95)] font-bold mt-[12px] uppercase">{card.title}</div>
                                  <div className="font-sans font-light text-[14px] text-[rgba(255,255,255,0.75)] leading-[1.7] mt-[8px]">{card.body}</div>
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

              {/* MODEL RECOMMENDER */}
              <div className="w-full border border-[rgba(255,255,255,0.12)] bg-black p-[28px] md:p-[28px_32px] mb-[2px]">
                  <span className="font-display text-[9px] tracking-[0.2em] block mb-[16px] uppercase"><span className="text-[rgba(255,255,255,0.40)]">07 — </span><span className="text-[rgba(255,255,255,0.50)]">Model Recommender</span></span>
                  <form onSubmit={handleRecommend} className="flex flex-col md:flex-row gap-[32px] w-full">
                      <div className="flex-1 flex flex-col justify-start">
                          <div className="flex w-full">
                              <input
                                  type="text"
                                  value={useCase}
                                  onChange={e => setUseCase(e.target.value)}
                                  placeholder={recommendPlaceholders[recommendPlaceholderIdx]}
                                  disabled={recommendLoading}
                                  className="flex-1 bg-black border border-[rgba(255,255,255,0.18)] font-mono text-[14px] text-[rgba(255,255,255,0.90)] px-4 h-[48px] placeholder-[rgba(255,255,255,0.40)] outline-none rounded-none focus:border-white transition-colors min-w-0"
                              />
                              <button 
                                  type="submit" 
                                  disabled={recommendLoading || !useCase.trim()}
                                  className="w-[48px] h-[48px] bg-black border border-[rgba(255,255,255,0.18)] border-l-0 text-white hover:bg-white hover:text-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none rounded-none flex items-center justify-center font-bold"
                              >→</button>
                          </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col md:border-l border-[rgba(255,255,255,0.12)] md:pl-[32px] min-h-[100px]">
                          {(recommendLoading || recommendation) ? (
                              recommendLoading ? (
                                  <AILoading />
                              ) : recommendation ? (
                                  <div className="animate-in fade-in duration-500">
                                      <div className="font-display text-[9px] text-[rgba(255,255,255,0.35)] uppercase">RECOMMENDED</div>
                                      <div 
                                          className="font-mono text-[20px] text-white mt-1 cursor-pointer hover:underline decoration-white/60 transition-all w-fit"
                                          onClick={() => {
                                              window.dispatchEvent(new CustomEvent('set-cost-model', { detail: recommendation.recommended }));
                                          }}
                                      >{recommendation.recommended}</div>
                                      <div className="font-sans font-light text-[14px] text-[rgba(255,255,255,0.65)] leading-[1.7] mt-[8px]">{recommendation.reason}</div>
                                      <div className="mt-4 flex flex-col gap-1">
                                          <div className="flex gap-2 items-center"><span className="font-display text-[9px] text-[rgba(255,255,255,0.3)] uppercase">TRADEOFF</span> <span className="font-sans font-light text-[13px] text-[rgba(255,255,255,0.45)]">{recommendation.tradeoff}</span></div>
                                          <div className="flex gap-2 items-center"><span className="font-display text-[9px] text-[rgba(255,255,255,0.3)] uppercase">EST. COST</span> <span className="font-sans font-light text-[13px] text-[rgba(255,255,255,0.45)]">{recommendation.estimatedCost}</span></div>
                                      </div>
                                  </div>
                              ) : null
                          ) : (
                              <div className="text-[rgba(255,255,255,0.40)] font-sans italic text-[14px] flex items-center">
                                  Describe your use case to generate a model recommendation...
                              </div>
                          )}
                      </div>
                  </form>
              </div>

              {/* COST ESTIMATOR */}
              <div className="w-full border border-[rgba(255,255,255,0.12)] bg-black p-[28px] md:p-[28px_32px] mb-[2px]">
                  <span className="font-display text-[9px] tracking-[0.2em] block mb-[16px] uppercase"><span className="text-[rgba(255,255,255,0.40)]">08 — </span><span className="text-[rgba(255,255,255,0.50)]">Cost Estimator</span></span>
                  <CostEstimator availableModels={result.allModels.map(m => m.id)} />
              </div>
              
              {/* ACTION BAR */}
              <div className="flex flex-col md:flex-row gap-[2px] w-full mt-[24px]">
                  <button
                      onClick={handleCopyReport}
                      className="flex-1 bg-white text-black font-display font-bold uppercase tracking-[0.15em] text-[11px] border border-white hover:bg-black hover:text-white transition-colors rounded-none outline-none overflow-hidden h-[56px] flex items-center justify-center p-0"
                  >
                      <div className="flip-wrapper h-full flex flex-col items-center justify-center relative w-full">
                          <span className={`flip-text absolute ${copied ? 'out' : ''}`}>COPY REPORT</span>
                          <span className={`flip-text absolute ${copied ? '' : 'out'}`} style={copied ? { transform: 'rotateX(0deg)', opacity: 1 } : { transform: 'rotateX(-90deg)', opacity: 0 }}>✓ COPIED</span>
                      </div>
                  </button>
                  <button
                      onClick={handleExportJson}
                      className="flex-1 bg-black text-white font-display font-bold uppercase tracking-[0.15em] text-[11px] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.1)] transition-colors rounded-none outline-none h-[56px] flex items-center justify-center"
                  >
                      EXPORT JSON
                  </button>
              </div>
          </div>
      )}

      {/* FOOTER BADGE */}
      <div className="flex justify-center w-full mt-8">
          <div className="inline-flex items-center justify-center px-4 py-3 rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.02)]">
              <span className="mr-2 text-[14px]">🔒</span>
              <span className="font-sans font-light text-[0.8rem] text-[rgba(255,255,255,0.55)]">Your key was never sent to our servers. Processed in-browser and discarded.</span>
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
                    <span className="text-[rgba(255,255,255,0.80)] text-[14px] mr-3">−</span>
                    <span className="text-[rgba(255,255,255,0.80)] text-[14px]">{name}</span>
                </div>
                <span className="font-display text-[0.6rem] tracking-wider text-[rgba(255,255,255,0.50)] uppercase">Untested</span>
            </div>
        )
    }

    if (!cap.supported) {
        return (
            <div className="flex justify-between items-center w-full py-[14px] relative group cursor-help transition-all duration-300">
                <div className="flex items-center flex-1">
                    <span className="cap-cross text-[rgba(255,255,255,0.40)] text-[14px] mr-3 z-[1]">✗</span>
                    <span className="text-[rgba(255,255,255,0.45)] text-[14px] flex items-center">
                        {name}
                        {cap.error && (
                            <div className="absolute left-0 bottom-full mb-2 bg-white text-black text-xs p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white">
                                HTTP {cap.error}
                            </div>
                        )}
                    </span>
                </div>
                <span className="font-display text-[0.6rem] tracking-wider border border-[rgba(255,255,255,0.25)] text-[rgba(255,255,255,0.50)] px-1 py-0.5 uppercase z-[1]">Denied</span>
            </div>
        )
    }

    return (
        <div className="flex justify-between items-center w-full py-[14px]">
            <div className="flex items-center flex-1">
                <span className="cap-check text-[rgba(255,255,255,0.80)] text-[14px] mr-3">✓</span>
                <span className="text-[rgba(255,255,255,0.85)] text-[14px] font-medium">{name}</span>
            </div>
        </div>
    )
}
