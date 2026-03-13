import React, { useState } from 'react';
import { ProviderType, DiscoveryResult, CapabilityStatus } from '../types';
import { Shield, Key, CheckCircle, XCircle, Search, Server, Sparkles, Image as ImageIcon, Music, Video, Database, AlertTriangle, ChevronDown, Activity, Info } from 'lucide-react';

export default function Dashboard() {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<ProviderType | 'auto'>('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllModels, setShowAllModels] = useState(false);

  const [clientSideOnly, setClientSideOnly] = useState(false);

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
    setShowAllModels(false);

    try {
        if (clientSideOnly) {
           setError('Browser mode is disabled during active testing updates. Please uncheck it to use the full backend tester.');
        } else {
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
        }
    } catch (err: any) {
        setError(err.message || 'An error occurred');
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
      auto: 'Auto-detected Provider'
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <Search className="text-blue-600 w-8 h-8" />
                API Capability Discovery
            </h1>
            <p className="text-gray-500 mt-2">Discover what models and endpoints your API key unlocks securely.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" /> Secure & Stateless
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleDiscover} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                        <select 
                            value={provider} 
                            onChange={(e) => setProvider(e.target.value as ProviderType | 'auto')}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-gray-50 border outline-none font-medium"
                        >
                            <option value="auto">✨ Auto-Detect (Universal Key)</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="groq">Groq</option>
                            <option value="gemini">Google Gemini</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-gray-50 border outline-none font-mono text-sm"
                                placeholder={provider === 'auto' ? "sk-..." : "Paste key here..."}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Keys are never stored or logged and are immediately discarded.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading || !apiKey.trim()}
                            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2 shadow-sm"
                        >
                            {loading ? <Server className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            {loading ? 'Active Testing...' : 'Discover Capabilities'}
                        </button>
                    </div>
                    {(apiKey || result || error) && (
                        <button
                            type="button"
                            onClick={clearForm}
                            className="w-full px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                        Clear Everything
                        </button> 
                    )}
                </form>
            </div>
            
            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-red-800 animate-in fade-in slide-in-from-bottom-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Error discovering capabilities</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}
            
            {result?.rateLimits && (result.rateLimits.requestsPerMinute || result.rateLimits.tokensPerMinute) && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-600 uppercase flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-blue-500" /> Detected Ratelimits
                    </h3>
                    <div className="space-y-3">
                        {result.rateLimits.requestsPerMinute && (
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="text-sm text-gray-600">Requests per Minute</span>
                                <span className="font-semibold text-gray-900">{result.rateLimits.requestsPerMinute.toLocaleString()}</span>
                            </div>
                        )}
                        {result.rateLimits.tokensPerMinute && (
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="text-sm text-gray-600">Tokens per Minute</span>
                                <span className="font-semibold text-gray-900">{result.rateLimits.tokensPerMinute.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${result.status === 'valid' ? 'border-gray-100' : 'border-red-200'}`}>
                <div className={`border-b p-6 flex justify-between items-center ${result.status === 'valid' ? 'bg-gray-50 border-gray-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                           <Server className={`w-6 h-6 ${result.status === 'valid' ? 'text-indigo-600' : 'text-red-500'}`} />
                           {providerNames[result.provider]} Details
                        </h2>
                        {result.status === 'valid' ? (
                            <p className="text-sm text-gray-500 mt-1">Key validated and capabilities mapped via active tests.</p>
                        ) : (
                            <p className="text-sm text-red-600 mt-1">Failed to validate API key.</p>
                        )}
                    </div>
                    {result.status === 'valid' ? (
                        <div className="px-3 py-1 flex items-center gap-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-sm shadow-sm">
                            <CheckCircle className="w-4 h-4" /> Valid Identity
                        </div>
                    ) : (
                        <div className="px-3 py-1 flex items-center gap-2 bg-red-100 text-red-800 rounded-full font-semibold text-sm shadow-sm">
                            <XCircle className="w-4 h-4" /> Invalid Key
                        </div>
                    )}
                </div>
                
                {result.status === 'valid' && (
                    <div className="p-6">
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Actively Verified Capabilities
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CapabilityCard title="Text Generation" cap={result.capabilities.textGeneration} icon={<Sparkles className="w-5 h-5" />} payload="/chat/completions" />
                                <CapabilityCard title="Embeddings" cap={result.capabilities.embeddings} icon={<Database className="w-5 h-5" />} payload="/embeddings" />
                                <CapabilityCard title="Image Generation" cap={result.capabilities.imageGeneration} icon={<ImageIcon className="w-5 h-5" />} payload="/images" />
                                <CapabilityCard title="Audio Processing" cap={result.capabilities.audioGeneration} icon={<Music className="w-5 h-5" />} payload="/audio" />
                                <CapabilityCard title="Video Generation" cap={result.capabilities.videoGeneration} icon={<Video className="w-5 h-5" />} payload="/video" />
                            </div>
                        </div>

                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Server className="w-4 h-4" /> Verified Models</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">{result.allModels.length} Total</span>
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {result.topModels.map(m => (
                                    <div key={m.id} className={`p-3 border rounded-xl flex flex-col justify-center ${m.permissionDenied ? 'bg-red-50/30 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {m.permissionDenied ? <XCircle className="text-red-400 w-4 h-4" /> : <CheckCircle className="text-emerald-500 w-4 h-4" />}
                                                <span className={`font-semibold text-sm ${m.permissionDenied ? 'text-gray-500 line-through decoration-red-300' : 'text-gray-900'}`}>{m.id}</span>
                                            </div>
                                            {m.permissionDenied && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded">Denied</span>}
                                        </div>
                                        {(m.maxInputTokens || m.maxOutputTokens) && !m.permissionDenied && (
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                {m.maxInputTokens && <span>In: {Math.round(m.maxInputTokens / 1000)}k</span>}
                                                {m.maxOutputTokens && <span>Out: {Math.round(m.maxOutputTokens / 1000)}k</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setShowAllModels(!showAllModels)} className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold py-2">
                                {showAllModels ? 'Hide extended models' : 'Show all available models'} <ChevronDown className={`w-4 h-4 transition-transform ${showAllModels ? 'rotate-180' : ''}`} />
                            </button>

                            {showAllModels && (
                                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                    <div className="flex flex-wrap gap-2">
                                        {result.allModels.filter(m => !result.topModels.find(tm => tm.id === m.id)).map(m => (
                                            <span key={m.id} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm inline-flex items-center gap-1.5 hover:border-blue-300 transition-colors">
                                                {m.id}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-in fade-in duration-500">
                <Shield className="w-16 h-16 mb-4 text-gray-200" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Ready for Discovery</h3>
                <p className="max-w-md text-sm">Paste your universal API key securely on the left to instantly run active endpoint tests verifying models and limits.</p>
                <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
                    <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 text-left">
                        <Activity className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">Performs tiny native connection tests to `/chat/completions` etc.</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 text-left">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">Maps token rate limits directly from HTTP active response headers.</span>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({ title, cap, icon, payload }: { title: string, cap: CapabilityStatus, icon: React.ReactNode, payload: string }) {
    if (!cap.tested) {
        return (
            <div className={`p-4 rounded-xl border flex flex-col items-start bg-gray-50 border-gray-100 opacity-50`}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 text-gray-400">
                        <div className="p-2 rounded-lg bg-gray-200 text-gray-500">{icon}</div>
                        <span className="font-semibold text-sm">{title}</span>
                    </div>
                    <span className="text-xs uppercase font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Untested</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`p-4 rounded-xl flex flex-col items-start transition-all duration-300 ${cap.supported ? 'bg-blue-50/80 border border-blue-200 shadow-sm' : 'bg-red-50 border border-red-100'}`}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 text-gray-900">
                    <div className={`p-2 rounded-lg ${cap.supported ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-500'}`}>
                        {icon}
                    </div>
                    <span className="font-semibold text-sm">{title}</span>
                </div>
                {cap.supported ? (
                    <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 animate-in zoom-in" />
                ) : (
                    <XCircle className="text-red-400 w-5 h-5 flex-shrink-0 animate-in zoom-in" />
                )}
            </div>
            {cap.error && !cap.supported && (
               <div className="mt-3 text-xs bg-red-100 text-red-700 px-2 py-1 rounded w-full flex items-center gap-1">
                   <AlertTriangle className="w-3 h-3" /> Denied ({cap.error})
               </div> 
            )}
            {cap.supported && (
                <div className="mt-3 text-xs text-blue-600/70 border-t border-blue-100 pt-2 w-full truncate">
                    Verified <span className="font-mono text-[10px]">{payload}</span>
                </div>
            )}
        </div>
    );
}
