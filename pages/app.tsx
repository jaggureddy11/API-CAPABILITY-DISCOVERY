import Head from 'next/head';
import Link from 'next/link';
import Dashboard from '../components/Dashboard';

export default function App() {
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
              </div>
          </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-16 py-12 md:py-20 flex flex-col items-center">
        <Dashboard />
      </main>
    </div>
  );
}
