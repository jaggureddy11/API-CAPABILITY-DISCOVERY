import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Dashboard from '../components/Dashboard';

interface HistoryEntry {
  id: string;
  provider: string;
  scannedAt: string;
  status: string;
  capabilityCount: number;
  modelCount: number;
  keyHint: string;
}

export default function App() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadHistory = () => {
    const raw = localStorage.getItem('apilens_history');
    if (raw) setHistory(JSON.parse(raw));
    else setHistory([]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    const handleUpdate = () => loadHistory();
    window.addEventListener('historyUpdated', handleUpdate);
    return () => window.removeEventListener('historyUpdated', handleUpdate);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('apilens_history');
    setHistory([]);
  };

  function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }

  return (
    <div className="landing-theme min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Head>
        <title>APILens | Analyze Your Key</title>
        <meta name="description" content="Discover the capabilities securely for your API keys." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=JetBrains+Mono&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --bg: #000000;
            --fg: #ffffff;
            --fg-muted: rgba(255, 255, 255, 0.6);
            --fg-faint: rgba(255, 255, 255, 0.4);
            --border: rgba(255, 255, 255, 0.15);
            
            --font-serif: 'Playfair Display', serif;
            --font-sans: 'Inter', sans-serif;
            --font-display: 'Syne', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        body {
            background-color: var(--bg);
            color: var(--fg);
        }

        .landing-theme ::selection { background: var(--fg); color: var(--bg); }
        .landing-theme ::-moz-selection { background: var(--fg); color: var(--bg); }

        .font-serif { font-family: var(--font-serif); }
        .font-sans { font-family: var(--font-sans); font-weight: 300; }
        .font-display { font-family: var(--font-display); }
        .font-mono { font-family: var(--font-mono); }
      `}} />

      {/* Navbar exactly like landing page */}
      <nav className="sticky top-0 left-0 w-full z-[100] border-b border-[rgba(255,255,255,0.1)] backdrop-blur-md bg-black/70 transition-transform duration-400">
          <div className="max-w-[1400px] mx-auto px-4 md:px-16 flex justify-between items-center h-[80px]">
              <Link href="/" className="font-serif italic text-2xl text-white no-underline transition-colors hover:text-white/80">APILens</Link>
              <div className="flex items-center gap-8">
                  <Link href="/#process" className="hidden md:block font-display uppercase text-[0.7rem] tracking-[0.2em] text-white hover:text-white/60 transition-colors">Process</Link>
                  <Link href="/#features" className="hidden md:block font-display uppercase text-[0.7rem] tracking-[0.2em] text-white hover:text-white/60 transition-colors">Capabilities</Link>
                  <Link href="/#pricing" className="hidden md:block font-display uppercase text-[0.7rem] tracking-[0.2em] text-white hover:text-white/60 transition-colors">Pricing</Link>
                  <Link href="/app" className="font-display text-[0.65rem] uppercase tracking-[0.15em] px-5 py-2.5 border border-[rgba(255,255,255,0.15)] bg-transparent text-white font-bold hover:bg-white hover:text-black transition-colors duration-200">Analyze Key</Link>
                  <button onClick={() => setHistoryOpen(true)} className="relative flex items-center justify-center text-white hover:text-white/70 transition-colors outline-none ml-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {history.length > 0 && (
                          <span className="absolute -top-2 -right-3 font-mono text-[9px] bg-white text-black px-1 min-w-[16px] text-center font-bold">
                              {history.length}
                          </span>
                      )}
                  </button>
              </div>
          </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-16 py-12 md:py-20 flex flex-col items-center">
        <Dashboard />
      </main>

      {/* HISTORY DRAWER */}
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${historyOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setHistoryOpen(false)}
      ></div>

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-full md:w-[280px] bg-black border-r border-[rgba(255,255,255,0.15)] z-[210] transform transition-transform duration-300 flex flex-col ${historyOpen ? 'translate-x-[0%]' : 'translate-x-[-100%]'}`}>
        <div className="p-6 border-b border-[rgba(255,255,255,0.15)] flex justify-between items-center bg-black">
          <span className="font-display text-[0.7rem] uppercase tracking-widest text-white">Scan History</span>
          <button onClick={() => setHistoryOpen(false)} className="text-white/50 hover:text-white text-sm font-mono outline-none">[×]</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black">
          {history.length === 0 ? (
            <div className="p-8 text-center text-white/30 font-sans text-[0.8rem] font-light italic">
              No recent scans found.
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="p-5 border-b border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-default group">
                <div className="font-display font-bold text-white text-[0.85rem] uppercase tracking-wide mb-1 flex items-center justify-between">
                    {h.provider === 'gemini' ? 'Google Gemini' : (h.provider || '').charAt(0).toUpperCase() + (h.provider || '').slice(1)}
                    {h.status === 'valid' && <span className="text-white opacity-50 text-[10px]">✓</span>}
                </div>
                <div className="font-mono text-white/40 text-[0.7rem] mb-2">{h.keyHint}</div>
                <div className="font-sans text-[0.65rem] text-white/30 tracking-wide flex items-center justify-between">
                    <span>{timeAgo(h.scannedAt)}</span>
                    <span>·</span>
                    <span>{h.modelCount} models</span>
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="w-full text-center p-4 border-t border-[rgba(255,255,255,0.1)] font-display text-[0.65rem] uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-colors outline-none"
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}
