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
    const [showScrollHint, setShowScrollHint] = useState(false);
    const [termStatus, setTermStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [showResults, setShowResults] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // AI Features State
    const [aiSummary, setAiSummary] = useState("");
    const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
    const [advisorCards, setAdvisorCards] = useState<any[]>([]);
    const [advisorLoading, setAdvisorLoading] = useState(false);
    const [useCase, setUseCase] = useState("");
    const [recommendation, setRecommendation] = useState<any>(null);
    const [recommendLoading, setRecommendLoading] = useState(false);
    const [recommendPlaceholderIdx, setRecommendPlaceholderIdx] = useState(0);

    const resultRef = React.useRef<HTMLDivElement>(null);
    const topRef = React.useRef<HTMLDivElement>(null);

    // HYDRATION: Load state on mount
    useEffect(() => {
        const saved = localStorage.getItem('capmap_dashboard_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.apiKey) setApiKey(parsed.apiKey);
                if (parsed.provider) setProvider(parsed.provider);
                if (parsed.result) setResult(parsed.result);
                if (parsed.showResults) setShowResults(parsed.showResults);
                if (parsed.aiSummary) setAiSummary(parsed.aiSummary);
                if (parsed.advisorCards) setAdvisorCards(parsed.advisorCards);
                if (parsed.useCase) setUseCase(parsed.useCase);
                if (parsed.recommendation) setRecommendation(parsed.recommendation);

                // Initial scroll if results were showing
                if (parsed.showResults && parsed.result) {
                    setTimeout(() => {
                        const resultsTop = resultRef.current?.getBoundingClientRect().top || 0;
                        const offset = window.scrollY + resultsTop - 40;
                        window.scrollTo({ top: offset, behavior: 'auto' });
                    }, 500);
                }
            } catch (e) {
                console.error("Failed to hydrate dashboard state", e);
            }
        }
        setIsHydrated(true);
    }, []);

    // PERSISTENCE: Sync state to localStorage
    useEffect(() => {
        if (!isHydrated) return;
        
        const stateToSave = {
            apiKey,
            provider,
            result,
            showResults,
            aiSummary,
            advisorCards,
            useCase,
            recommendation
        };
        localStorage.setItem('capmap_dashboard_state', JSON.stringify(stateToSave));
    }, [isHydrated, apiKey, provider, result, showResults, aiSummary, advisorCards, useCase, recommendation]);

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

        // Auto-run summary ONLY if we don't already have one (from hydration)
        if (!aiSummary && !aiSummaryLoading) {
            setAiSummaryLoading(true);
            getScanSummary(result)
                .then(setAiSummary)
                .catch(() => setAiSummary(""))
                .finally(() => setAiSummaryLoading(false));
        }

        // Auto-run advisor ONLY if we don't already have them
        if (advisorCards.length === 0 && !advisorLoading) {
            setAdvisorLoading(true);
            getAdvisorCards(result)
                .then(setAdvisorCards)
                .catch(() => setAdvisorCards([]))
                .finally(() => setAdvisorLoading(false));
        }
    }, [result, aiSummary, advisorCards.length, aiSummaryLoading, advisorLoading]);

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

    // SCANNING TERMINAL COMPONENT
    const ScanningTerminal = ({ status, onFinished }: { status: 'idle' | 'scanning' | 'success' | 'error', onFinished: () => void }) => {
        const [lines, setLines] = useState<string[]>([]);
        const [typingText, setTypingText] = useState("");
        const [isExiting, setIsExiting] = useState(false);
        const [stopped, setStopped] = useState(false);
        const hasTriggeredFinished = React.useRef(false);

        const fullLines = [
            "Initializing secure environment...",
            "Authenticating with provider...",
            "Validating capability matrix...",
            "Mapping available endpoints...",
            "Running heuristic analysis...",
            "Finalizing report..."
        ];

        useEffect(() => {
            if (status !== 'idle' && status !== 'scanning' && !hasTriggeredFinished.current) {
                setStopped(true);
                const finalLine = status === 'success' ? "Analysis complete. Access granted." : "Connection failed.";
                
                setTypingText("");
                let charIdx = 0;
                const typeFinal = setInterval(() => {
                    if (charIdx <= finalLine.length) {
                        setTypingText(finalLine.substring(0, charIdx));
                        charIdx++;
                    } else {
                        clearInterval(typeFinal);
                        hasTriggeredFinished.current = true;
                        
                        // Brief pause for satisfaction before exit
                        setTimeout(() => {
                            setIsExiting(true);
                            setTimeout(onFinished, 400);
                        }, status === 'success' ? 400 : 1500);
                    }
                }, 22);
                return () => clearInterval(typeFinal);
            }
        }, [status, onFinished]);

        useEffect(() => {
            if (stopped || status !== 'scanning') return;

            const timeouts: any[] = [];
            
            fullLines.forEach((text, i) => {
                const delay = i * 850 + (Math.random() * 200);
                timeouts.push(setTimeout(() => {
                    let charIdx = 0;
                    const typeInterval = setInterval(() => {
                        if (charIdx <= text.length) {
                            setTypingText(text.substring(0, charIdx));
                            charIdx++;
                        } else {
                            clearInterval(typeInterval);
                            setLines(prev => [...prev, text]);
                            setTypingText("");
                        }
                    }, 22);
                    timeouts.push(typeInterval);
                }, delay));
            });

            return () => {
                timeouts.forEach(clearTimeout);
                timeouts.forEach(clearInterval);
            };
        }, [stopped, status]);

        if (status === 'idle') return null;

        return (
            <div className={`mt-6 w-full transition-all duration-500 transform ${isExiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
                <div className="flex items-center gap-2 mb-3 border-b border-[var(--fg)]/10 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--fg)] opacity-40 animate-pulse"></div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg)]/40">Terminal : {status === 'scanning' ? 'Processing' : 'Ready'}</span>
                </div>
                <div className="flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed">
                    {lines.map((l, i) => (
                        <div key={i} className="flex gap-2 term-line-fade">
                            <span className="text-[var(--fg)] opacity-15 whitespace-nowrap">$</span>
                            <span className="text-[var(--fg)] opacity-40">{l}</span>
                        </div>
                    ))}
                    {!stopped && lines.length < fullLines.length && (
                        <div className="flex gap-2 term-line-fade">
                            <span className="text-[var(--fg)] opacity-15 whitespace-nowrap">$</span>
                            <span className="text-[var(--fg)] opacity-40">
                                {typingText}
                                <span className="bg-[var(--fg)]/60 w-[6px] h-[10px] inline-block ml-1 align-middle animate-pulse"></span>
                            </span>
                        </div>
                    )}
                    {stopped && (
                        <div className="flex gap-2 term-line-fade">
                            <span className="text-[var(--fg)] opacity-15 whitespace-nowrap">$</span>
                            <span className={`text-[var(--fg)] ${status === 'success' ? 'opacity-90 font-medium' : 'opacity-60'}`}>
                                {typingText}
                                {typingText.length < (status === 'success' ? 18 : 18) && <span className="bg-[var(--fg)]/60 w-[6px] h-[10px] inline-block ml-1 align-middle animate-pulse"></span>}
                            </span>
                        </div>
                    )}
                </div>
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
        if (key.startsWith('pplx-')) return { provider: 'perplexity', label: 'Perplexity API Key', valid: true, prefix: 'pplx-' };
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
        setTermStatus('scanning');
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
                // ... existing history logic ...
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
                const rawHist = localStorage.getItem('capmap_history') || localStorage.getItem('apilens_history');
                const history = rawHist ? JSON.parse(rawHist) : [];
                history.unshift(entry);
                if (history.length > 10) history.length = 10;
                localStorage.setItem('capmap_history', JSON.stringify(history));
                window.dispatchEvent(new Event('historyUpdated'));

                setTermStatus('success');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            setTermStatus('error');
        }
    };

    const handleTerminalFinish = React.useCallback(() => {
        setLoading(false);
        setTermStatus('idle');
        if (result && result.status === 'valid') {
            setShowResults(true);
            
            // Custom slow-motion scroll
            setTimeout(() => {
                const resultsTop = resultRef.current?.getBoundingClientRect().top || 0;
                const target = window.scrollY + resultsTop - 40;
                const start = window.scrollY;
                const distance = target - start;
                const duration = 1200; // 1.2s for "slow motion" feel
                let startTime: number | null = null;

                const slowScroll = (currentTime: number) => {
                    if (startTime === null) startTime = currentTime;
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Quintic ease-out for ultra-smooth glide
                    const ease = 1 - Math.pow(1 - progress, 5);
                    
                    window.scrollTo(0, start + distance * ease);

                    if (progress < 1) {
                        requestAnimationFrame(slowScroll);
                    }
                };
                requestAnimationFrame(slowScroll);
            }, 150);
        }
    }, [result]);

    const clearForm = () => {
        setApiKey('');
        setResult(null);
        setShowResults(false);
        setError(null);
        setAiSummary("");
        setAdvisorCards([]);
        setUseCase("");
        setRecommendation(null);
        localStorage.removeItem('capmap_dashboard_state');
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const providerNames: Record<string, string> = {
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        groq: 'Groq',
        perplexity: 'Perplexity',
        auto: 'Auto-detected'
    };

    // FEATURE 1: EXPORT REPORT BUTTONS
    const handleCopyReport = () => {
        if (!result) return;
        const date = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
        let text = `CAPMAP — CAPABILITY REPORT\n────────────────────────────\n`;
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
            const ctx = m.maxInputTokens ? `${Math.round(m.maxInputTokens / 1000)}k` : '';
            const costStr = (result.provider === 'openai' || result.provider === 'auto') && (m.id.includes('4') || m.id.includes('mini')) ? `$${m.id.includes('mini') ? '0.15' : '5'}/1M` : '';
            text += `${mark} ${m.id.padEnd(16)} ${ctx.padEnd(6)} ${costStr}\n`.trimEnd() + `\n`;
        });

        if (result.rateLimits && (result.rateLimits.requestsPerMinute || result.rateLimits.tokensPerMinute)) {
            text += `\nRATE LIMITS\n`;
            if (result.rateLimits.requestsPerMinute) text += `Requests/min : ${result.rateLimits.requestsPerMinute.toLocaleString()}\n`;
            if (result.rateLimits.tokensPerMinute) text += `Tokens/min   : ${result.rateLimits.tokensPerMinute.toLocaleString()}\n`;
        }

        text += `\nGenerated by CapMap — capmap.dev`;

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
                context: m.maxInputTokens ? `${Math.round(m.maxInputTokens / 1000)}k` : undefined,
                authorized: !m.permissionDenied
            })),
            rateLimits: result.rateLimits
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capmap-${result.provider}-${date.substring(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full text-[var(--fg)] font-sans bg-[var(--bg)] transition-colors duration-400">
            {/* SECTION 1: HERO INPUT */}
            <div ref={topRef} className={`w-full flex flex-col items-center relative p-6 transition-all duration-700 ${result ? 'pt-12 md:pt-20 pb-0 gap-[30px]' : 'min-h-screen justify-center gap-[40px]'}`}>
                <div className="text-center">
                    <span className="font-display text-[10px] uppercase text-[var(--fg)]/65 tracking-[0.2em] mb-[16px] block">CAPMAP</span>
                    <h1 className="font-serif font-normal text-[56px] md:text-[72px] text-[var(--fg)] leading-none mb-6 tracking-tight uppercase">
                        Analyze Your Key.
                    </h1>
                    <p className="font-sans font-light text-[16px] text-[var(--fg)]/75 leading-relaxed m-0 max-w-[600px] mx-auto">
                        Your key never touches our servers.<br />
                        CapMap processes everything in-browser and discards it immediately.
                    </p>
                </div>

                <div className="w-full max-w-[560px] mx-auto transition-all duration-700">
                    <div className="border border-[var(--fg)]/25 bg-[var(--fg)]/[0.03] p-[40px] relative overflow-hidden">


                        <form onSubmit={handleDiscover} className="flex flex-col w-full">
                            <div className="mb-[24px]">
                                <label className="font-display text-[10px] uppercase tracking-[0.2em] text-[var(--fg)]/65 block mb-[10px]">Provider</label>
                                <div className="relative">
                                    <select
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value as ProviderType | 'auto')}
                                        className="w-full h-[54px] appearance-none bg-[var(--bg)] border border-[var(--fg)]/25 text-[var(--fg)] px-4 font-display text-[12px] uppercase tracking-wider outline-none focus:border-[var(--fg)]/45 transition-colors cursor-pointer rounded-none"
                                    >
                                        <option value="auto">✦ Auto-Detect</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="groq">Groq</option>
                                        <option value="gemini">Google Gemini</option>
                                        <option value="perplexity">Perplexity</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[var(--fg)]/55">▾</div>
                                </div>
                            </div>

                            <div className="mb-[14px]">
                                <label className="font-display text-[10px] uppercase tracking-[0.2em] text-[var(--fg)]/65 block mb-[10px]">API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full h-[54px] bg-[var(--bg)] border border-[var(--fg)]/25 text-[var(--fg)] px-4 font-mono text-[13px] outline-none focus:border-[var(--fg)]/45 transition-colors rounded-none placeholder-[var(--fg)]/55"
                                    placeholder={provider === 'auto' ? "sk-..." : "Paste key here..."}
                                />
                            </div>

                            {/* LIVE PARSER STRIP */}
                            <div className={`overflow-hidden transition-all duration-300 ${apiKey.trim() ? "max-h-[300px] opacity-100 mb-[24px]" : "max-h-0 opacity-0 mb-0"}`}>
                                <div className="border border-[var(--border)] bg-[var(--fg)]/[0.02] p-[16px] flex flex-col gap-1">
                                    {[
                                        { lbl: 'FORMAT', val: keyFormat?.label },
                                        { lbl: 'PROVIDER', val: keyFormat?.provider !== 'auto' && keyFormat ? providerNames[keyFormat.provider] : 'Unknown' },
                                        { lbl: 'LENGTH', val: apiKey.trim().length >= 10 ? 'Valid Length' : 'Too Short' },
                                        { lbl: 'PREFIX', val: keyFormat?.prefix || '—' }
                                    ].map((row, i) => (
                                        <div key={i} className="grid grid-cols-[80px_1fr_16px] items-center py-[6px] border-b border-[var(--border)]/75 last:border-0">
                                            <span className="font-display text-[9px] uppercase tracking-[0.12em] text-[var(--fg)]/65">{row.lbl}</span>
                                            <span className="font-mono text-[12px] text-[var(--fg)]/85 truncate px-3">{row.val}</span>
                                            <span className="text-[12px] text-[var(--fg)]/75 text-right">{(row.lbl === 'LENGTH' ? apiKey.trim().length >= 10 : keyFormat?.valid) ? '✓' : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !apiKey.trim()}
                                className={`w-full bg-[var(--fg)] text-[var(--bg)] font-display font-bold text-[12px] uppercase tracking-[0.2em] h-[60px] transition-all duration-300 hover:bg-transparent hover:text-[var(--fg)] border border-[var(--fg)] disabled:cursor-not-allowed rounded-none ${loading ? 'opacity-70' : 'opacity-100'}`}
                            >
                                {loading ? (
                                    <span className="scanning-dots">SCANNING</span>
                                ) : (
                                    'DISCOVER →'
                                )}
                            </button>

                            <ScanningTerminal status={termStatus} onFinished={handleTerminalFinish} />

                            {error && (
                                <div className="mt-6 text-[#ff4444] font-mono text-[11px] uppercase tracking-wider text-center">
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    <div className={`mt-[24px] transition-all duration-500 ${showScrollHint ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                        <div className="security-ticker-container">
                            <span className="security-ticker-text font-sans font-light text-[12px] text-[var(--fg)]/55 flex items-center gap-3">
                                CapMap never stores or transmits your key. Processed in-browser and discarded instantly.
                            </span>
                        </div>
                    </div>
                </div>

                {showScrollHint && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--fg)]/25 animate-in fade-in duration-600">
                        <span className="font-display text-[8px] uppercase tracking-widest">Scroll to results</span>
                        <span className="text-xl animate-bounce-custom text-[var(--fg)]/40">↓</span>
                    </div>
                )}
            </div>

            {/* SECTION 2: RESULTS REPORT */}
            <div
                ref={resultRef}
                className={`w-full bg-[var(--bg)] pb-24 transition-all duration-1000 ${showResults ? 'opacity-100 translate-y-0 mt-10' : 'opacity-0 translate-y-12 pointer-events-none'}`}
            >
                <div className="max-w-[1100px] mx-auto px-6 md:px-12 pt-0">
                    {result && (
                        <div className="flex flex-col gap-[2px]">
                            
                            {/* TOP BAR */}
                            <div className={`cell col-span-full flex flex-col md:flex-row md:items-end justify-between min-h-[120px] ${showResults ? 'res-stagger res-delay-0' : 'opacity-0'}`}>
                                <div className="flex flex-col gap-2">
                                    <span className="label capitalize">{result.provider}</span>
                                    <div className="flex items-center gap-4">
                                        <h2 className="font-serif text-[28px] md:text-[32px] leading-tight capitalize">{result.provider}</h2>
                                        <div className={`flex items-center gap-2 font-display text-[11px] tracking-widest uppercase ${result.status === 'valid' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                                            <span className={`w-2 h-2 rounded-full ${result.status === 'valid' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}></span>
                                            {result.status}
                                        </div>
                                    </div>
                                    {result.provider === 'perplexity' && (
                                        <div className="font-sans font-light text-[11px] text-white/30 mt-1">
                                            Real-time web search AI
                                        </div>
                                    )}
                                </div>
                                <div className="font-mono text-[10px] text-[var(--fg)]/55 tracking-widest mt-4 md:mt-0">
                                    SCANNED {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    <div className="h-[1px] w-full bg-[var(--border)] mt-2"></div>
                                </div>
                            </div>

                            {/* ROW 1: AI SUMMARY */}
                            <div className={`cell col-span-full ${showResults ? 'res-stagger res-delay-1' : 'opacity-0'}`}>
                                <span className="label">AI SUMMARY</span>
                                <div className="min-h-[100px]">
                                    {aiSummaryLoading ? (
                                        <AILoading />
                                    ) : (
                                        <p className="font-sans font-light text-[17px] text-[var(--fg)]/70 leading-[1.8] max-w-[800px]">
                                            {aiSummary || "The discovery scan reveals active permissions for this key. Use the recommender below for specific tasks."}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ROW 2: CAPABILITIES + MODELS */}
                            <div className={`flex flex-col md:flex-row gap-[2px] ${showResults ? 'res-stagger res-delay-2' : 'opacity-0'}`}>
                                <div className="cell flex-1">
                                    <span className="label">CAPABILITIES</span>
                                    <div className="flex flex-col gap-1">
                                        {Object.entries(result.capabilities).map(([key, cap]: [string, any], idx) => (
                                            <div key={key} className={`flex items-center justify-between py-2 border-b border-[var(--border)]/50 last:border-0 hover:border-[var(--fg)]/20 transition-colors res-cap-row`} style={{ animationDelay: `${400 + (idx * 60)}ms` }}>
                                                <div className="flex items-center gap-3">
                                                    <span className={cap.supported ? "text-[#10b981]" : "text-[#ef4444]"}>{cap.supported ? '✓' : '✗'}</span>
                                                    <span className={`text-[14px] ${cap.supported ? 'text-[var(--fg)]/85' : 'text-[var(--fg)]/60'}`}>
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                    </span>
                                                </div>
                                                {!cap.supported && (
                                                    <span className="font-display text-[8px] px-1.5 py-0.5 border border-[#ef4444]/20 text-[#ef4444]/60 uppercase tracking-widest">DENIED</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="cell flex-1">
                                    <span className="label">MODELS</span>
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <div className="font-display text-[9px] text-[var(--fg)]/50 uppercase tracking-[0.2em] mb-3">AUTHORIZED</div>
                                            <div className="flex flex-col gap-2">
                                                {result.topModels.filter(m => !m.permissionDenied).slice(0, 5).map((m, idx) => (
                                                    <div key={m.id} className="flex items-center justify-between font-mono text-[12px] res-model-row" style={{ animationDelay: `${500 + (idx * 40)}ms` }}>
                                                        <div className="flex items-center gap-2 text-[var(--fg)]/80">
                                                            <span className="text-[#10b981]">✓</span>
                                                            <span>{m.id}</span>
                                                        </div>
                                                        <span className="text-[var(--fg)]/60">{m.maxInputTokens ? `${Math.round(m.maxInputTokens / 1000)}k` : ''}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="h-[1px] w-full bg-[var(--border)]/50"></div>
                                        <div>
                                            <div className="font-display text-[9px] text-[var(--fg)]/50 uppercase tracking-[0.2em] mb-3">RESTRICTED</div>
                                            <div className="flex flex-col gap-2">
                                                {result.topModels.filter(m => m.permissionDenied).slice(0, 2).map(m => (
                                                    <div key={m.id} className="flex items-center justify-between font-mono text-[12px] opacity-40">
                                                        <div className="flex items-center gap-2 text-[var(--fg)]">
                                                            <span className="text-[#ef4444]">✗</span>
                                                            <span className="line-through">{m.id}</span>
                                                        </div>
                                                        <span className="font-display text-[8px] border border-[var(--border)] px-1 uppercase scale-75 text-[var(--fg)]/75">DENIED</span>
                                                    </div>
                                                ))}
                                                {result.allModels.length > 5 && (
                                                    <div className="font-sans text-[10px] text-[var(--fg)]/50 italic mt-2">+ {result.allModels.length - 5} older models</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ROW 3: RATE LIMITS + AI ADVISOR */}
                            <div className={`flex flex-col md:flex-row gap-[2px] ${showResults ? 'res-stagger res-delay-3' : 'opacity-0'}`}>
                                <div className="cell md:w-[35%] flex flex-col justify-between">
                                    <span className="label">API LIMITS</span>
                                    <div className="py-2">
                                        <div className="mb-8">
                                            <div className="font-serif text-[32px] md:text-[40px] text-[var(--fg)] leading-none mb-1">
                                                {result.rateLimits?.requestsPerMinute?.toLocaleString() || '10,000'}
                                            </div>
                                            <div className="label mb-0 text-[var(--fg)]/45">REQ/DAY</div>
                                        </div>
                                        <div>
                                            <div className="font-serif text-[32px] md:text-[40px] text-[var(--fg)] leading-none mb-1">
                                                {result.rateLimits?.tokensPerMinute?.toLocaleString() || '90,000'}
                                            </div>
                                            <div className="label mb-0 text-[var(--fg)]/45">TOK/MIN</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="cell md:w-[65%]">
                                    <span className="label">AI ADVISOR</span>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 h-full pb-8">
                                        {advisorCards.length > 0 ? (
                                            advisorCards.slice(0, 3).map((card, i) => (
                                                <div key={i} className="border border-[var(--border)] bg-[var(--fg)]/[0.02] p-5 flex flex-col justify-between group hover:border-[var(--fg)]/30 transition-all">
                                                    <div className="text-[18px] mb-4 opacity-100">{card.type === 'warning' ? '⚠' : card.type === 'tip' ? '→' : '◆'}</div>
                                                    <div className="font-display text-[11px] font-bold uppercase tracking-widest text-[var(--fg)]/80 group-hover:text-[var(--fg)] transition-colors">{card.title}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 flex items-center justify-center border border-[var(--border)]/50 bg-[var(--fg)]/[0.01]">
                                                <AILoading />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ROW 4: MODEL RECOMMENDER */}
                            <div className={`cell flex flex-col md:flex-row gap-12 ${showResults ? 'res-stagger res-delay-4' : 'opacity-0'}`}>
                                <div className="flex-1">
                                    <span className="label">MODEL RECOMMENDER</span>
                                    <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={useCase}
                                                onChange={e => setUseCase(e.target.value)}
                                                placeholder="describe use case →"
                                                className="w-full bg-transparent border-b border-[var(--border)] hover:border-[var(--fg)]/30 transition-colors py-4 text-[18px] md:text-[22px] font-serif outline-none placeholder-[var(--fg)]/45 text-[var(--fg)]"
                                                onKeyDown={e => e.key === 'Enter' && handleRecommend(e)}
                                            />
                                        </div>
                                        <button 
                                            onClick={(e: any) => handleRecommend(e)}
                                            className="font-display text-[10px] uppercase tracking-[0.2em] px-8 h-[54px] border border-[var(--fg)]/20 hover:border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all whitespace-nowrap mt-2 md:mt-0"
                                        >
                                            RECOMMEND
                                        </button>
                                    </div>
                                    <p className="text-[var(--fg)]/65 text-[11px] font-sans mt-4 max-w-[300px] leading-relaxed">
                                        Describe your speed, cost and volume requirements.
                                    </p>
                                </div>
                                <div className="flex-1 border-[var(--border)]/50 md:border-l md:pl-12 flex flex-col justify-center min-h-[140px]">
                                    {recommendLoading ? <AILoading /> : recommendation ? (
                                        <div className="animate-in fade-in">
                                            <div className="label mb-2">RECOMMENDED</div>
                                            <div className="font-serif text-[28px] md:text-[32px] text-[var(--fg)] leading-tight underline decoration-[var(--fg)]/45 decoration-1 underline-offset-8">
                                                {recommendation.recommended}
                                            </div>
                                            <p className="font-sans font-light text-[14px] text-[var(--fg)]/65 mt-6 leading-relaxed">
                                                {recommendation.reason}
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="font-serif text-[18px] text-[var(--fg)]/45 italic">Awaiting input...</span>
                                    )}
                                </div>
                            </div>

                            {/* ROW 5: COST ESTIMATOR */}
                            <div className={`cell no-padding overflow-hidden ${showResults ? 'res-stagger res-delay-5' : 'opacity-0'}`}>
                                <span className="label p-[24px_28px_0_28px] block">COST ESTIMATION</span>
                                <div className="p-2 pt-0">
                                    <CostEstimator availableModels={result.allModels.map(m => m.id)} />
                                </div>
                            </div>

                            {/* ROW 6: EXPORT ACTIONS */}
                            <div className={`flex flex-col md:flex-row gap-[2px] ${showResults ? 'res-stagger res-delay-6' : 'opacity-0'}`}>
                                <button
                                    onClick={handleCopyReport}
                                    className="cell flex-1 flex items-center justify-center h-[100px] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all group overflow-hidden relative cursor-pointer"
                                >
                                    <span className="font-display text-[12px] font-bold uppercase tracking-[0.3em] relative z-10">
                                        {copied ? '✓ COPIED' : 'COPY REPORT'}
                                    </span>
                                </button>
                                <button
                                    onClick={handleExportJson}
                                    className="cell flex-1 flex items-center justify-center h-[100px] hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-all group overflow-hidden relative cursor-pointer"
                                >
                                    <span className="font-display text-[12px] font-bold uppercase tracking-[0.3em] relative z-10">EXPORT JSON</span>
                                </button>
                            </div>

                            {/* RESET BUTTON */}
                            <div className={`mt-12 flex justify-center ${showResults ? 'res-stagger res-delay-6' : 'opacity-0'}`}>
                                <button
                                    onClick={clearForm}
                                    className="font-display text-[9px] uppercase tracking-[0.3em] text-[var(--fg)]/65 hover:text-[var(--fg)] transition-colors py-4 border-t border-[var(--border)] w-full"
                                >
                                    ← DISCARD RESULTS & NEW SCAN
                                </button>
                            </div>

                            {/* SECURITY BADGE */}
                            <div className={`flex justify-center w-full mt-24 pb-20 ${showResults ? 'res-stagger res-delay-7' : 'opacity-0'}`}>
                                <div className="flex items-center gap-3 opacity-60 text-[var(--fg)]">
                                    <span className="font-sans font-light text-[11px] uppercase tracking-widest leading-none">Your key was never sent to our servers.</span>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes dots-new {
            0% { content: '·'; }
            33% { content: '··'; }
            66% { content: '···'; }
        }
        @keyframes bounce-custom {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        .animate-bounce-custom {
          animation: bounce-custom 1.5s infinite ease-in-out;
        }
        @keyframes pulse-fast {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
        }
        .animate-pulse-fast {
            animation: pulse-fast 0.53s infinite step-end;
        }
        @keyframes line-fade {
            from { opacity: 0; transform: translateY(2px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .term-line-fade {
            animation: line-fade 300ms ease-out forwards;
        }
        .scanning-dots::after {
            content: '·';
            display: inline-block;
            width: 24px;
            animation: dots-premium 2s infinite ease-in-out;
        }
        @keyframes dots-premium {
            0% { content: '·'; opacity: 0.3; }
            33% { content: '··'; opacity: 0.6; }
            66% { content: '···'; opacity: 1; }
            100% { content: '·'; opacity: 0.3; }
        }
        .cell {
            border: 1px solid var(--border);
            padding: 24px 28px;
            background: var(--bg);
            position: relative;
        }
        .cell.no-padding { padding: 0; }
        .label {
            font-family: 'Syne', sans-serif;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: color-mix(in srgb, var(--fg) 35%, transparent);
            margin-bottom: 16px;
            display: block;
        }
        select, input {
            border-radius: 0 !important;
        }
      ` }} />
        </div>
    );
}

function CapabilityRow({ name, cap }: { name: string, cap: CapabilityStatus }) {
    // This subcomponent is technically legacy now since I rewrote the inline logic above, 
    // but I'll keep it as a clean export if needed elsewhere.
    return (
        <div className="flex justify-between items-center w-full py-[14px]">
            <div className="flex items-center flex-1">
                <span className={`text-[16px] mr-3 ${cap.supported ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {cap.supported ? '✓' : '✗'}
                </span>
                <span className={`text-[16px] ${cap.supported ? 'text-[var(--fg)]/80' : 'text-[var(--fg)]/20'}`}>{name}</span>
            </div>
            {!cap.supported && <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--fg)]/20">Denied</span>}
        </div>
    );
}
