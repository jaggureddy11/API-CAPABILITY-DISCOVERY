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
          <div className="font-mono text-[0.85rem] text-[var(--fg)]/80 p-8 flex flex-col gap-3 relative animate-in fade-in duration-300 flex-1">
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
    <div className="w-full text-[var(--fg)] font-sans max-w-[1400px] mx-auto animate-in fade-in duration-700">
      
      {/* PAGE HEADER */}
      <div className="mb-[32px] text-center md:text-left flex flex-col items-center md:items-start w-full">
          <span className="font-display text-[9px] uppercase text-[color-mix(in_srgb,var(--fg)_40%,transparent)] tracking-[0.25em] mb-[12px] block">Capability Discovery</span>
          <h1 className="font-serif font-bold tracking-tighter leading-none m-[8px_0_6px_0] text-[clamp(40px,4vw,64px)]">
              ANALYZE YOUR KEY.
          </h1>
          <p className="font-sans text-[var(--fg-muted)] font-light text-[15px] mb-[32px]">
              Your key never touches our servers. Results are instant and discarded immediately.
          </p>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-[2px] mb-[2px]">
        <div className="w-full md:w-[300px] lg:w-[360px] shrink-0 border border-[var(--border)] border-r md:border-[var(--border)] bg-[var(--bg)] p-[28px] flex flex-col md:sticky top-[80px] h-fit z-10">
            <form onSubmit={handleDiscover} className="flex flex-col w-full">
                <div className="mb-[8px]">
                    <label className="font-display text-[9px] uppercase tracking-[0.2em] text-[var(--fg-muted)] block mb-[8px]">Provider</label>
                    <div className="relative">
                        <select 
                            value={provider} 
                            onChange={(e) => setProvider(e.target.value as ProviderType | 'auto')}
                            className="w-full appearance-none bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] p-3 font-mono text-sm uppercase outline-none focus:border-[var(--fg)] transition-colors cursor-pointer rounded-none"
                        >
                            <option value="auto">✦ Auto-Detect</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="groq">Groq</option>
                            <option value="gemini">Google Gemini</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--fg)]/50">▾</div>
                    </div>
                </div>

                <div className="mt-[20px] mb-[8px]">
                    <label className="font-display text-[9px] uppercase tracking-[0.2em] text-[var(--fg-muted)] block mb-[8px]">API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] p-3 font-mono text-sm outline-none focus:border-[var(--fg)] transition-colors rounded-none placeholder-[color-mix(in_srgb,var(--fg)_20%,transparent)]"
                        placeholder={provider === 'auto' ? "sk-..." : "Paste key here..."}
                        required
                    />
                </div>

                {/* FEATURE 2: LIVE PARSER STRIP */}
                <div className={`overflow-hidden transition-all duration-300 ${apiKey.trim() ? "max-h-[200px] opacity-100 mt-[12px] mb-[16px]" : "max-h-0 opacity-0 mb-0"}`}>
                    <div className="border border-[var(--border)] bg-[var(--bg)] p-[20px] text-[var(--fg)] font-mono text-[10px] leading-relaxed relative">
                        <div className="mb-2 text-[color-mix(in_srgb,var(--fg)_80%,transparent)] break-all">{apiKey.substring(0, 24)}{apiKey.length > 24 ? '...' : ''}</div>
                        <div className="flex gap-4 text-[color-mix(in_srgb,var(--fg)_20%,transparent)] mb-2 whitespace-pre">── ── ── ── ── ── ── ── ── ──</div>
                        <div className="grid grid-cols-[60px_1fr_20px] gap-2 items-center">
                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[var(--fg-muted)] tracking-widest text-[8px]">FORMAT</span>
                                <span className="text-[color-mix(in_srgb,var(--fg)_80%,transparent)]">{keyFormat?.label}</span>
                                <span className={keyFormat?.valid ? "text-[color-mix(in_srgb,var(--fg)_70%,transparent)]" : "text-[color-mix(in_srgb,var(--fg)_40%,transparent)]"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[var(--fg-muted)] tracking-widest text-[8px]">PROVIDER</span>
                                <span className="text-[color-mix(in_srgb,var(--fg)_80%,transparent)]">{keyFormat?.provider !== 'auto' && keyFormat ? providerNames[keyFormat.provider] : 'Unknown'}</span>
                                <span className={keyFormat?.valid ? "text-[color-mix(in_srgb,var(--fg)_70%,transparent)]" : "text-[color-mix(in_srgb,var(--fg)_40%,transparent)]"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[var(--fg-muted)] tracking-widest text-[8px]">LENGTH</span>
                                <span className="text-[color-mix(in_srgb,var(--fg)_80%,transparent)]">{apiKey.trim().length >= 10 ? 'Valid' : 'Too Short'}</span>
                                <span className={apiKey.trim().length >= 10 ? "text-[color-mix(in_srgb,var(--fg)_70%,transparent)]" : "text-[color-mix(in_srgb,var(--fg)_40%,transparent)]"}>{apiKey.trim().length >= 10 ? "✓" : "✗"}</span>
                            </div>

                            <div className="parser-row col-span-3 grid grid-cols-subgrid">
                                <span className="font-display uppercase text-[var(--fg-muted)] tracking-widest text-[8px]">PREFIX</span>
                                <span className="text-[color-mix(in_srgb,var(--fg)_80%,transparent)]">{keyFormat?.prefix}</span>
                                <span className={keyFormat?.valid ? "text-[color-mix(in_srgb,var(--fg)_70%,transparent)]" : "text-[color-mix(in_srgb,var(--fg)_40%,transparent)]"}>{keyFormat?.valid ? "✓" : "✗"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`text-[var(--fg-muted)] text-[11px] font-sans font-light leading-relaxed mb-[20px] ${apiKey.trim() ? "mt-[16px]" : ""}`}>
                    Keys are never stored or logged. Discarded instantly in volatile memory.
                </div>

                <div className="flex flex-col gap-[8px]">
                    <button
                        type="submit"
                        disabled={loading || !apiKey.trim()}
                        className="w-full bg-[var(--fg)] text-[var(--bg)] font-display font-bold text-[11px] uppercase tracking-[0.2em] h-[52px] border border-[var(--fg)] hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none flex items-center justify-center cursor-pointer"
                    >
                        {loading ? 'DISCOVERING...' : 'DISCOVER →'}
                    </button>

                    {(result || error) && (
                        <button
                            type="button"
                            onClick={clearForm}
                            className="w-full bg-transparent text-[var(--fg-muted)] font-display text-[10px] uppercase tracking-[0.1em] h-[44px] border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] hover:text-[var(--fg)] transition-colors duration-300 flex items-center justify-center cursor-pointer"
                        >
                        CLEAR
                        </button> 
                    )}
                </div>
            </form>
        </div>

        {/* RIGHT COLUMN: Results Panel */}
        <div className="flex-1 min-w-0 border border-[var(--border)] md:border-l-0 bg-[var(--bg)] flex flex-col relative overflow-y-auto md:max-h-[calc(100vh-200px)] custom-scrollbar">
            
            {/* 1. Empty State */}
            {!loading && !result && !error && (
                <div className="flex-1 flex flex-col items-center justify-center p-[32px] text-center border-[var(--border)] animate-in fade-in duration-500 min-h-[400px]">
                    <div className="flex flex-col items-center text-[color-mix(in_srgb,var(--fg)_40%,transparent)] w-full max-w-[320px]">
                        <h3 className="font-display text-[12px] tracking-[0.2em] uppercase mb-[24px]">Ready for Discovery</h3>
                        <p className="font-sans font-light text-[14px] leading-relaxed mb-[32px] text-[var(--fg-muted)]">
                            Paste your API key on the left to begin analysis.
                        </p>
                        <div className="font-sans font-light text-[14px] flex flex-col gap-[12px] items-center text-center text-[var(--fg-muted)]">
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
                    <div className="text-[var(--fg)]/80 leading-relaxed whitespace-pre-wrap mt-2">{error}</div>
                </div>
            )}

            {/* 4. Results State */}
            {result && !loading && (
                <div className="flex-1 font-mono text-[14px] leading-[1.6] px-[16px] xl:px-[28px] py-[28px] relative">
                    
                    {/* TIMESTAMP HEADER */}
                    <div className="absolute top-[28px] right-[28px] font-mono text-[10px] text-[var(--fg-muted)]">
                        Scanned {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="res-stagger res-delay-0 flex flex-col gap-2 pb-[28px]">
                        <span className="font-display text-[9px] tracking-[0.2em] block mb-[16px] uppercase">
                            <span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">01 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">Provider</span>
                        </span>
                        <div className="flex justify-between items-center w-full">
                            <span className="font-display text-[9px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">PROVIDER</span>
                            <span className="font-sans font-semibold text-[15px] text-[var(--fg-muted)]">{providerNames[result.provider] || result.provider}</span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-[8px]">
                            <span className="font-display text-[9px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">STATUS</span>
                            <span className={`text-[15px] font-semibold text-[color-mix(in_srgb,var(--fg)_90%,transparent)] flex items-center gap-2 ${result.status === 'valid' ? 'status-pulse' : 'status-invalid'}`}>
                                <span className={`w-[8px] h-[8px] rounded-full ${result.status === 'valid' ? 'bg-[var(--fg)] shadow-[0_0_8px_color-mix(in srgb, var(--fg) 80%, transparent)]' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`}></span> 
                                {result.status === 'valid' ? 'VALID' : 'INVALID'}
                            </span>
                        </div>
                    </div>

                    {result.status === 'valid' && (
                        <>
                            <div className="w-full h-[1px] bg-[color-mix(in_srgb,var(--fg)_7%,transparent)]"></div>
                                    <div className="res-stagger res-delay-1 py-[28px] flex flex-col items-start min-h-[100px]">
                                        <span className="font-display text-[9px] tracking-[0.2em] block mb-[8px] uppercase">
                                            <span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">02 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">AI Summary</span>
                                        </span>
                                        {aiSummaryLoading ? (
                                            <AILoading />
                                        ) : aiSummary ? (
                                            <p className="font-sans font-light text-[15px] text-[var(--fg-muted)] leading-[1.8] w-full max-w-full m-0 p-0 animate-in fade-in duration-500">
                                                {aiSummary}
                                            </p>
                                        ) : (
                                            <span 
                                                className="font-sans font-light text-[12px] text-[var(--fg)]/25 italic cursor-pointer hover:text-[var(--fg)]/50 transition-colors mt-[8px]" 
                                                onClick={() => {
                                                    setAiSummaryLoading(true);
                                                    getScanSummary(result).then(setAiSummary).catch(()=>setAiSummary("")).finally(()=>setAiSummaryLoading(false));
                                                }}
                                            >AI analysis timed out. Try again →</span>
                                        )}
                                    </div>

                            {/* CAPABILITIES */}
                            <div className="w-full h-[1px] bg-[color-mix(in_srgb,var(--fg)_7%,transparent)]"></div>
                            <div className="res-stagger res-delay-1 py-[28px]">
                                <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]">
                                    <span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">03 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">Capabilities</span>
                                </span>
                                <div className="flex flex-col">
                                    <div className="res-cap-row border-b border-[var(--border)] last:border-0"><CapabilityRow name="Text Generation" cap={result.capabilities.textGeneration} /></div>
                                    <div className="res-cap-row border-b border-[var(--border)] last:border-0"><CapabilityRow name="Embeddings" cap={result.capabilities.embeddings} /></div>
                                    <div className="res-cap-row border-b border-[var(--border)] last:border-0"><CapabilityRow name="Image Generation" cap={result.capabilities.imageGeneration} /></div>
                                    <div className="res-cap-row border-b border-[var(--border)] last:border-0"><CapabilityRow name="Audio Processing" cap={result.capabilities.audioGeneration} /></div>
                                    <div className="res-cap-row border-b border-[var(--border)] last:border-0"><CapabilityRow name="Video Generation" cap={result.capabilities.videoGeneration} /></div>
                                </div>
                            </div>

                            {/* MODELS */}
                            <div className="res-stagger res-delay-2 w-full h-[1px] bg-[color-mix(in_srgb,var(--fg)_7%,transparent)]"></div>
                            <div className="res-stagger res-delay-2 py-[28px]">
                                <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]">
                                    <span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">04 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">Models</span>
                                </span>
                                
                                {result.topModels.filter(m => !m.permissionDenied).length > 0 && (
                                    <div className="mb-6">
                                        <div className="font-display text-[8px] text-[var(--fg)]/30 uppercase tracking-widest mb-2">AUTHORIZED</div>
                                        <div className="flex flex-col">
                                            {result.topModels.filter(m => !m.permissionDenied).map(m => (
                                                <div key={m.id} className="res-model-row flex justify-between items-center w-full py-[12px] border-b border-[var(--border)] last:border-0">
                                                    <div className="flex items-center flex-1">
                                                        <span className="cap-check text-[color-mix(in_srgb,var(--fg)_80%,transparent)] text-lg mr-3">✓</span>
                                                        <span className="text-[var(--fg-muted)] font-mono text-[13px] text-left">{m.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6 flex-1 justify-end font-mono text-[12px] text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">
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
                                        <div className="w-full h-[1px] bg-[color-mix(in_srgb,var(--fg)_7%,transparent)] my-4"></div>
                                        <div className="font-display text-[8px] text-[color-mix(in_srgb,var(--fg)_40%,transparent)] uppercase tracking-widest mb-2">RESTRICTED</div>
                                        <div className="flex flex-col">
                                            {result.topModels.filter(m => m.permissionDenied).map(m => (
                                                <div key={m.id} className="res-model-row flex justify-between items-center w-full py-[12px] border-b border-[var(--border)] last:border-0">
                                                    <div className="flex items-center flex-1">
                                                        <span className="cap-cross text-[color-mix(in_srgb,var(--fg)_40%,transparent)] text-lg mr-3">✗</span>
                                                        <span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)] font-mono text-[13px] text-left line-through">{m.id}</span>
                                                    </div>
                                                    <div className="flex flex-1 justify-end items-center">
                                                        <span className="font-display text-[0.6rem] tracking-wider border border-[var(--border)] text-[color-mix(in_srgb,var(--fg)_50%,transparent)] px-1 py-0.5 uppercase">Denied</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.allModels.length > result.topModels.length && (
                                    <div className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)] mt-4 italic font-sans font-light">
                                        + {result.allModels.length - result.topModels.length} older models
                                    </div>
                                )}
                            </div>

                            {/* RATE LIMITS */}
                            {(result.rateLimits?.requestsPerMinute || result.rateLimits?.tokensPerMinute) && (
                                <>
                                    <div className="res-stagger res-delay-3 w-full h-[1px] bg-[color-mix(in_srgb,var(--fg)_7%,transparent)]"></div>
                                    <div className="res-stagger res-delay-3 py-[28px]">
                                        <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]">
                                            <span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">05 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">Rate Limits</span>
                                        </span>
                                        <div className="flex flex-col gap-3">
                                            {result.rateLimits.requestsPerMinute && (
                                                <div className="flex justify-between items-center w-full max-w-[300px]">
                                                    <span className="text-[14px] text-[var(--fg-muted)]">Requests / min</span>
                                                    <span className="text-[14px] text-[var(--fg-muted)]">{result.rateLimits.requestsPerMinute.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {result.rateLimits.tokensPerMinute && (
                                                <div className="flex justify-between items-center w-full max-w-[300px]">
                                                    <span className="text-[14px] text-[var(--fg-muted)]">Tokens / min</span>
                                                    <span className="text-[14px] text-[var(--fg-muted)]">{result.rateLimits.tokensPerMinute.toLocaleString()}</span>
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
              <div className="w-full border border-[var(--border)] bg-[var(--bg)] p-[28px] md:p-[28px_32px] mb-[2px]">
                  <span className="font-display text-[9px] uppercase tracking-[0.2em] block mb-[16px]"><span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">06 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">AI Advisor</span></span>
                  {advisorLoading ? (
                      <AILoading />
                  ) : advisorCards.length > 0 ? (
                      <div className="flex flex-col md:flex-row gap-[2px] animate-in fade-in w-full duration-500">
                          {advisorCards.map((card, idx) => (
                              <div 
                                  key={idx} 
                                  className="flex-1 w-full flex flex-col border border-[var(--border)] p-[24px] bg-[var(--bg-2)] hover:border-[var(--border)] transition-colors duration-200 min-h-[140px]"
                                  style={{ animationDelay: `${idx * 80}ms` }}
                              >
                                  <div className="font-display text-[9px] text-[var(--fg-muted)] tracking-[0.15em] uppercase">
                                      {card.type === 'warning' ? '⚠ WARNING' : card.type === 'tip' ? '→ TIP' : '◆ INSIGHT'}
                                  </div>
                                  <div className="font-display text-[13px] text-[var(--fg-muted)] font-bold mt-[12px] uppercase">{card.title}</div>
                                  <div className="font-sans font-light text-[14px] text-[var(--fg-muted)] leading-[1.7] mt-[8px]">{card.body}</div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <span 
                          className="font-sans font-light text-[12px] text-[var(--fg)]/25 italic cursor-pointer hover:text-[var(--fg)]/50 transition-colors" 
                          onClick={() => {
                              setAdvisorLoading(true);
                              getAdvisorCards(result).then(setAdvisorCards).catch(()=>setAdvisorCards([])).finally(()=>setAdvisorLoading(false));
                          }}
                      >AI analysis timed out. Try again →</span>
                  )}
              </div>

              {/* MODEL RECOMMENDER */}
              <div className="w-full border border-[var(--border)] bg-[var(--bg)] p-[28px] md:p-[28px_32px] mb-[2px]">
                  <span className="font-display text-[9px] tracking-[0.2em] block mb-[16px] uppercase"><span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">07 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">Model Recommender</span></span>
                  <form onSubmit={handleRecommend} className="flex flex-col md:flex-row gap-[32px] w-full">
                      <div className="flex-1 flex flex-col justify-start">
                          <div className="flex w-full">
                              <input
                                  type="text"
                                  value={useCase}
                                  onChange={e => setUseCase(e.target.value)}
                                  placeholder={recommendPlaceholders[recommendPlaceholderIdx]}
                                  disabled={recommendLoading}
                                  className="flex-1 bg-[var(--bg)] border border-[var(--border)] font-mono text-[14px] text-[color-mix(in_srgb,var(--fg)_90%,transparent)] px-4 h-[48px] placeholder-[color-mix(in_srgb,var(--fg)_40%,transparent)] outline-none rounded-none focus:border-[var(--fg)] transition-colors min-w-0"
                              />
                              <button 
                                  type="submit" 
                                  disabled={recommendLoading || !useCase.trim()}
                                  className="w-[48px] h-[48px] bg-[var(--bg)] border border-[var(--border)] border-l-0 text-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none rounded-none flex items-center justify-center font-bold"
                              >→</button>
                          </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col md:border-l border-[var(--border)] md:pl-[32px] min-h-[100px]">
                          {(recommendLoading || recommendation) ? (
                              recommendLoading ? (
                                  <AILoading />
                              ) : recommendation ? (
                                  <div className="animate-in fade-in duration-500">
                                      <div className="font-display text-[9px] text-[var(--fg-muted)] uppercase">RECOMMENDED</div>
                                      <div 
                                          className="font-mono text-[20px] text-[var(--fg)] mt-1 cursor-pointer hover:underline decoration-white/60 transition-all w-fit"
                                          onClick={() => {
                                              window.dispatchEvent(new CustomEvent('set-cost-model', { detail: recommendation.recommended }));
                                          }}
                                      >{recommendation.recommended}</div>
                                      <div className="font-sans font-light text-[14px] text-[var(--fg-muted)] leading-[1.7] mt-[8px]">{recommendation.reason}</div>
                                      <div className="mt-4 flex flex-col gap-1">
                                          <div className="flex gap-2 items-center"><span className="font-display text-[9px] text-[var(--fg-muted)] uppercase">TRADEOFF</span> <span className="font-sans font-light text-[13px] text-[var(--fg-muted)]">{recommendation.tradeoff}</span></div>
                                          <div className="flex gap-2 items-center"><span className="font-display text-[9px] text-[var(--fg-muted)] uppercase">EST. COST</span> <span className="font-sans font-light text-[13px] text-[var(--fg-muted)]">{recommendation.estimatedCost}</span></div>
                                      </div>
                                  </div>
                              ) : null
                          ) : (
                              <div className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)] font-sans italic text-[14px] flex items-center">
                                  Describe your use case to generate a model recommendation...
                              </div>
                          )}
                      </div>
                  </form>
              </div>

              {/* COST ESTIMATOR */}
              <div className="w-full border border-[var(--border)] bg-[var(--bg)] p-[28px] md:p-[28px_32px] mb-[2px]">
                  <span className="font-display text-[9px] tracking-[0.2em] block mb-[16px] uppercase"><span className="text-[color-mix(in_srgb,var(--fg)_40%,transparent)]">08 — </span><span className="text-[color-mix(in_srgb,var(--fg)_50%,transparent)]">Cost Estimator</span></span>
                  <CostEstimator availableModels={result.allModels.map(m => m.id)} />
              </div>
              
              {/* ACTION BAR */}
              <div className="flex flex-col md:flex-row gap-[2px] w-full mt-[24px]">
                  <button
                      onClick={handleCopyReport}
                      className="flex-1 bg-[var(--fg)] text-[var(--bg)] font-display font-bold uppercase tracking-[0.15em] text-[11px] border border-[var(--fg)] hover:bg-[var(--bg)] hover:text-[var(--fg)] transition-colors rounded-none outline-none overflow-hidden h-[56px] flex items-center justify-center p-0"
                  >
                      <div className="flip-wrapper h-full flex flex-col items-center justify-center relative w-full">
                          <span className={`flip-text absolute ${copied ? 'out' : ''}`}>COPY REPORT</span>
                          <span className={`flip-text absolute ${copied ? '' : 'out'}`} style={copied ? { transform: 'rotateX(0deg)', opacity: 1 } : { transform: 'rotateX(-90deg)', opacity: 0 }}>✓ COPIED</span>
                      </div>
                  </button>
                  <button
                      onClick={handleExportJson}
                      className="flex-1 bg-[var(--bg)] text-[var(--fg)] font-display font-bold uppercase tracking-[0.15em] text-[11px] border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--fg)_10%,transparent)] transition-colors rounded-none outline-none h-[56px] flex items-center justify-center"
                  >
                      EXPORT JSON
                  </button>
              </div>
          </div>
      )}

      {/* FOOTER BADGE */}
      <div className="flex justify-center w-full mt-8">
          <div className="inline-flex items-center justify-center px-4 py-3 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--fg)_2%,transparent)]">
              <span className="mr-2 text-[14px]">🔒</span>
              <span className="font-sans font-light text-[0.8rem] text-[var(--fg-muted)]">Your key was never sent to our servers. Processed in-browser and discarded.</span>
          </div>
      </div>
        <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: color-mix(in srgb, var(--fg) 15%, transparent) transparent;
            }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--fg) 15%, transparent); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--fg) 30%, transparent); }
        ` }} />

    </div>
  );
}

function CapabilityRow({ name, cap }: { name: string, cap: CapabilityStatus }) {
    if (!cap.tested) {
        return (
            <div className="flex justify-between items-center w-full py-[14px]">
                <div className="flex items-center flex-1">
                    <span className="text-[color-mix(in_srgb,var(--fg)_80%,transparent)] text-[14px] mr-3">−</span>
                    <span className="text-[color-mix(in_srgb,var(--fg)_80%,transparent)] text-[14px]">{name}</span>
                </div>
                <span className="font-display text-[0.6rem] tracking-wider text-[color-mix(in_srgb,var(--fg)_50%,transparent)] uppercase">Untested</span>
            </div>
        )
    }

    if (!cap.supported) {
        return (
            <div className="flex justify-between items-center w-full py-[14px] relative group cursor-help transition-all duration-300">
                <div className="flex items-center flex-1">
                    <span className="cap-cross text-[color-mix(in_srgb,var(--fg)_40%,transparent)] text-[14px] mr-3 z-[1]">✗</span>
                    <span className="text-[var(--fg-muted)] text-[14px] flex items-center">
                        {name}
                        {cap.error && (
                            <div className="absolute left-0 bottom-full mb-2 bg-[var(--fg)] text-[var(--bg)] text-xs p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-[var(--fg)]">
                                HTTP {cap.error}
                            </div>
                        )}
                    </span>
                </div>
                <span className="font-display text-[0.6rem] tracking-wider border border-[var(--border)] text-[color-mix(in_srgb,var(--fg)_50%,transparent)] px-1 py-0.5 uppercase z-[1]">Denied</span>
            </div>
        )
    }

    return (
        <div className="flex justify-between items-center w-full py-[14px]">
            <div className="flex items-center flex-1">
                <span className="cap-check text-[color-mix(in_srgb,var(--fg)_80%,transparent)] text-[14px] mr-3">✓</span>
                <span className="text-[var(--fg-muted)] text-[14px] font-medium">{name}</span>
            </div>
        </div>
    )
}
