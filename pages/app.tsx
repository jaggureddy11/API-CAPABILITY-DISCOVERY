import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Dashboard from '../components/Dashboard';
import ThemeToggle from '../components/ThemeToggle';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadHistory = () => {
    const raw = localStorage.getItem('capmap_history') || localStorage.getItem('apilens_history');
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
    localStorage.removeItem('capmap_history');
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
    <div className="landing-theme min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans selection:bg-[var(--fg)] selection:text-[var(--bg)]">
      <Head>
        <title>CapMap — Analyze Your Key</title>
        <meta name="description" content="Discover the capabilities securely for your API keys." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=JetBrains+Mono&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
            
            
            
            --fg-faint: color-mix(in srgb, var(--fg) 40%, transparent);
            
            
            --font-serif: 'Playfair Display', serif;
            --font-sans: 'Inter', sans-serif;
            --font-display: 'Syne', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        html, body, main, #__next, .landing-theme {
            background-color: var(--bg) !important;
            color: var(--fg);
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

        /* MOBILE NAV GRID */
        @media (max-width: 768px) {
            .nav-inner { 
                height: 60px !important;
                padding: 0 16px !important;
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
            }
            .nav-logo-link {
                position: absolute !important;
                left: 50% !important;
                top: 50% !important;
                transform: translate(-50%, -50%) !important;
                z-index: 10 !important;
                margin: 0 !important;
                display: flex !important;
            }
            .nav-actions-right {
                position: relative !important;
                z-index: 11 !important;
            }
            .mobile-toggle-wrapper {
                position: relative !important;
                z-index: 11 !important;
                display: flex !important;
            }
            .hide-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
            .mobile-toggle-wrapper { display: none !important; }
        }

        .mobile-toggle {
            display: none;
            background: transparent;
            border: none;
            color: var(--fg);
            cursor: pointer;
            padding: 8px;
            z-index: 101;
        }
        @media (max-width: 768px) {
            .mobile-toggle { 
                display: block;
                margin-left: -8px;
            }
        }

        .mobile-menu {
            position: fixed;
            top: 0;
            right: 0;
            width: 100%;
            height: 100vh;
            background: var(--bg);
            z-index: 100;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 24px;
            transform: translateX(100%);
            transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-menu.open {
            transform: translateX(0);
        }
        .mobile-menu .nav-link {
            font-family: var(--font-display);
            text-transform: uppercase;
            font-size: 1.2rem;
            letter-spacing: 0.1em;
            color: var(--fg);
            text-decoration: none;
        }
      `}} />

      {/* Navbar matches page theme */}
      <nav className="sticky top-0 left-0 w-full z-[100] border-b border-[var(--border)] bg-[var(--bg)] transition-colors duration-400">
          <div className="max-w-[1400px] mx-auto px-4 md:px-16 flex justify-between items-center h-[80px] nav-inner">
              <div className="mobile-toggle-wrapper">
                  <button 
                      className="mobile-toggle" 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                      {isMenuOpen ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                      )}
                  </button>
              </div>

              <Link href="/" style={{
                display:'flex',
                alignItems:'center',
                gap:'14px',
                textDecoration:'none'
              }} className="no-underline transition-colors hover:opacity-80 nav-logo-link">
                {/* Arc icon — clean and proportional */}
                <svg 
                  width="34" 
                  height="44" 
                  viewBox="0 0 28 40" 
                  fill="none"
                >
                  <path
                    d="M 24 4 A 15 15 0 1 0 24 36"
                    stroke="var(--fg)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle 
                    cx="24.5" cy="20" r="3" 
                    fill="var(--fg)"
                  />
                </svg>

                {/* Wordmark */}
                <span style={{
                  fontFamily:"'Libre Baskerville', Georgia, serif",
                  fontStyle:'italic',
                  fontWeight:700,
                  fontSize:'32px',
                  color:'var(--fg)',
                  letterSpacing:'0.5px',
                  lineHeight:1,
                  transition: 'all 300ms ease'
                }}>CapMap</span>
              </Link>
              <div className="flex items-center gap-8 nav-actions-right">
                  <Link href="/#process" className="hidden md:block font-display uppercase text-[0.7rem] tracking-[0.2em] text-[var(--fg)] hover:text-[var(--fg)]/60 transition-colors">Process</Link>
                  <Link href="/#features" className="hidden md:block font-display uppercase text-[0.7rem] tracking-[0.2em] text-[var(--fg)] hover:text-[var(--fg)]/60 transition-colors">Capabilities</Link>
                  <div className="hidden md:flex items-center">
                    <ThemeToggle />
                  </div>
                  <button onClick={() => setHistoryOpen(true)} className="relative flex items-center justify-center text-[var(--fg)] hover:text-[var(--fg)]/70 transition-colors outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {history.length > 0 && (
                          <span className="absolute -top-2 -right-3 font-mono text-[9px] bg-[var(--fg)] text-[var(--bg)] px-1 min-w-[16px] text-center font-bold">
                              {history.length}
                          </span>
                      )}
                  </button>
              </div>
          </div>

          <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
              <Link href="/#process" className="nav-link" onClick={() => setIsMenuOpen(false)}>Process</Link>
              <Link href="/#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>Capabilities</Link>
              <Link href="/#pricing" className="nav-link" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
              <div style={{ marginTop: '20px' }}>
                  <ThemeToggle />
              </div>
              <button 
                onClick={() => { setHistoryOpen(true); setIsMenuOpen(false); }}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                History ({history.length})
              </button>
          </div>
      </nav>

      <main className="w-full flex flex-col">
        <Dashboard />
      </main>

      {/* HISTORY DRAWER */}
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-[var(--bg)]/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${historyOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setHistoryOpen(false)}
      ></div>

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-full md:w-[280px] bg-[var(--bg)] border-r border-[var(--border)] z-[210] transform transition-transform duration-300 flex flex-col ${historyOpen ? 'translate-x-[0%]' : 'translate-x-[-100%]'}`}>
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]">
          <span className="font-display text-[0.7rem] uppercase tracking-widest text-[var(--fg)]">Scan History</span>
          <button onClick={() => setHistoryOpen(false)} className="text-[var(--fg)]/50 hover:text-[var(--fg)] text-sm font-mono outline-none">[×]</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg)]">
          {history.length === 0 ? (
            <div className="p-8 text-center text-[var(--fg)]/30 font-sans text-[0.8rem] font-light italic">
              No recent scans found.
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="p-5 border-b border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] transition-colors cursor-default group">
                <div className="font-display font-bold text-[var(--fg)] text-[0.85rem] uppercase tracking-wide mb-1 flex items-center justify-between">
                    {h.provider === 'gemini' ? 'Google Gemini' : h.provider === 'perplexity' ? 'Perplexity' : (h.provider || '').charAt(0).toUpperCase() + (h.provider || '').slice(1)}
                    {h.status === 'valid' && <span className="text-[var(--fg)] opacity-50 text-[10px]">✓</span>}
                </div>
                <div className="font-mono text-[var(--fg)]/40 text-[0.7rem] mb-2">{h.keyHint}</div>
                <div className="font-sans text-[0.65rem] text-[var(--fg)]/30 tracking-wide flex items-center justify-between">
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
            className="w-full text-center p-4 border-t border-[var(--border)] font-display text-[0.65rem] uppercase tracking-widest text-[var(--fg)]/40 hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-colors outline-none"
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}
