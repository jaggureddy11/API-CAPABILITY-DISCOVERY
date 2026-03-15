import React, { useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
    const navRef = useRef<HTMLElement>(null);
    const typewriterRef = useRef<HTMLDivElement>(null);
    const [notifiedDev, setNotifiedDev] = React.useState(false);
    const [notifiedTeam, setNotifiedTeam] = React.useState(false);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    useEffect(() => {
        // Intersection Observer
        const fadeElements = document.querySelectorAll('.fade-up');
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observerInstance.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
        fadeElements.forEach(el => observer.observe(el));

        // Navbar Scroll
        let lastScroll = 0;
        const handleScroll = () => {
            const currentScroll = window.pageYOffset;
            const navbar = navRef.current;
            if (navbar) {
                if (currentScroll > 10) navbar.classList.add('scrolled');
                else navbar.classList.remove('scrolled');

                if (currentScroll > lastScroll && currentScroll > 100) navbar.classList.add('hidden');
                else navbar.classList.remove('hidden');
            }
            lastScroll = currentScroll;
        };
        window.addEventListener('scroll', handleScroll);

        // Typewriter Animation
        const providerData = [
            {
                name: "OpenAI",
                models: "gpt-4o ✓  gpt-4-turbo ✓  gpt-3.5-turbo ✓",
                caps: "Text ✓  Embeddings ✓  Images ✓",
                rate: "10,000 req/day"
            },
            {
                name: "Anthropic",
                models: "claude-3-5-sonnet ✓  claude-3-opus ✓  claude-3-haiku ✓",
                caps: "Text ✓  Vision ✓  Tool Use ✓",
                rate: "5,000 req/day"
            },
            {
                name: "Google Gemini",
                models: "gemini-1.5-pro ✓  gemini-1.5-flash ✓  gemini-1.0-ultra ✓",
                caps: "Multi-Modal ✓  Long-Context ✓  Search ✓",
                rate: "Unrated (Free Tier Available)"
            },
            {
                name: "Groq",
                models: "llama-3-70b ✓  mixtral-8x7b ✓  gemma-7b ✓",
                caps: "Ultra-Fast Inference ✓  Production APIs ✓",
                rate: "30-50 requests/min"
            },
            {
                name: "Perplexity",
                models: "sonar-small ✓  sonar-large ✓  mistral-7b ✓",
                caps: "Live Search ✓  Citations ✓  Research ✓",
                rate: "1,000 requests/month"
            }
        ];

        let providerIdx = 0;
        let lineIdx = 0;
        let charIdx = 0;
        let timeoutId: ReturnType<typeof setTimeout>;
        let isAlive = true;
        let accumulatedText = "";

        const terminalEl = typewriterRef.current;
        if (terminalEl) terminalEl.innerHTML = '<span class="cursor-blink">█</span>';

        const getLines = (idx: number) => {
            const p = providerData[idx];
            return [
                "> Validating key... ✓",
                `> Provider detected: ${p.name}`,
                "> Fetching models... ✓",
                `> ${p.models}`,
                `> Capabilities: ${p.caps}`,
                `> Rate limit: ${p.rate}`
            ];
        };

        const typeWriter = () => {
            const el = typewriterRef.current;
            if (!el || !isAlive) return;

            const currentLines = getLines(providerIdx);

            if (lineIdx < currentLines.length) {
                const currentLine = currentLines[lineIdx];
                
                if (charIdx === 0 && lineIdx > 0) {
                    accumulatedText += '<br />';
                }

                if (charIdx < currentLine.length) {
                    if (charIdx === 0 && currentLine.startsWith('> ')) {
                        accumulatedText += '> ';
                        charIdx = 2;
                    } else {
                        accumulatedText += currentLine.charAt(charIdx);
                        charIdx++;
                    }
                    
                    el.innerHTML = accumulatedText + '<span class="cursor-blink">█</span>';
                    
                    let delay = Math.random() * 8 + 10;
                    if (accumulatedText.endsWith('✓')) delay = 400;
                    if (accumulatedText.endsWith(':')) delay = 150;
                    if (accumulatedText.endsWith('...')) delay = 300;
                    
                    timeoutId = setTimeout(typeWriter, delay);
                } else {
                    lineIdx++;
                    charIdx = 0;
                    timeoutId = setTimeout(typeWriter, 300);
                }
            } else {
                // Provider complete: wait, then move to the next one
                timeoutId = setTimeout(() => {
                    if (!isAlive || !el) return;
                    providerIdx = (providerIdx + 1) % providerData.length;
                    lineIdx = 0;
                    charIdx = 0;
                    accumulatedText = "";
                    el.innerHTML = '<span class="cursor-blink">█</span>';
                    typeWriter();
                }, 3000);
            }
        };

        timeoutId = setTimeout(typeWriter, 2400);

        return () => {
            isAlive = false;
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
            observer.disconnect();
        };

        timeoutId = setTimeout(typeWriter, 2400);

        return () => {
            isAlive = false;
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, []);

    // FAQ logic
    useEffect(() => {
        const faqItems = document.querySelectorAll('.faq-item');
        const clickHandlers = new Map();

        faqItems.forEach(item => {
            const btn = item.querySelector('.faq-q') as HTMLButtonElement;
            const answer = item.querySelector('.faq-a') as HTMLElement;

            if (!btn || !answer) return;

            const handler = () => {
                const isActive = item.classList.contains('active');

                // close all
                faqItems.forEach(faq => {
                    faq.classList.remove('active');
                    const a = faq.querySelector('.faq-a') as HTMLElement;
                    if (a && faq !== item) {
                        a.style.transitionTimingFunction = "var(--ease-in)";
                        a.style.height = '0px';
                    }
                });

                // open if wasn't active
                if (!isActive) {
                    item.classList.add('active');
                    answer.style.transitionTimingFunction = "var(--ease-io)";
                    answer.style.height = answer.scrollHeight + 'px';
                } else {
                    answer.style.transitionTimingFunction = "var(--ease-in)";
                    answer.style.height = '0px';
                }
            };

            btn.addEventListener('click', handler);
            clickHandlers.set(btn, handler);
        });

        return () => {
            faqItems.forEach(item => {
                const btn = item.querySelector('.faq-q') as HTMLButtonElement;
                if (btn && clickHandlers.has(btn)) {
                    btn.removeEventListener('click', clickHandlers.get(btn));
                }
            });
        };
    }, []);

    return (
        <div className="landing-theme">
            <Head>
                <title>CapMap — Map Every Capability Your API Key Unlocks</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=JetBrains+Mono&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;500;700&display=swap" rel="stylesheet" />
            </Head>
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
            
            
            
            --fg-faint: color-mix(in srgb, var(--fg) 40%, transparent);
            
            --border-strong: color-mix(in srgb, var(--fg) 40%, transparent);
            
            --font-serif: 'Playfair Display', serif;
            --font-sans: 'Inter', sans-serif;
            --font-display: 'Syne', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;

            --spacing-xs: 0.5rem;
            --spacing-sm: 1rem;
            --spacing-md: 2rem;
            --spacing-lg: 4rem;
            --spacing-xl: 8rem;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            }

        .landing-theme {
            background-color: var(--bg);
            color: var(--fg);
            font-family: var(--font-sans);
            font-weight: 300;
            line-height: 1.6;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* TYPOGRAPHY */
        h1, h2, h3, .serif { font-family: var(--font-serif); }
        .display { font-family: var(--font-display); }
        .mono { font-family: var(--font-mono); }
        
        .section-label {
            font-family: var(--font-display);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--fg-faint);
            margin-bottom: var(--spacing-md);
            display: block;
        }

        /* UTILITIES */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 var(--spacing-lg);
        }
        @media (max-width: 768px) {
            .container { padding: 0 var(--spacing-sm); }
        }

        .border-t { border-top: 1px solid var(--border); }
        .border-b { border-bottom: 1px solid var(--border); }
        .border-l { border-left: 1px solid var(--border); }
        .border-r { border-right: 1px solid var(--border); }
        .border-all { border: 1px solid var(--border); }

        /* BUTTONS */
        .btn {
            font-family: var(--font-display);
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            padding: 1rem 2rem;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--fg);
            text-decoration: none;
            display: inline-block;
            transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 700;
            position: relative;
            overflow: hidden;
            z-index: 1;
        }
        .btn::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: var(--fg);
            transform: translateY(100%);
            transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
            z-index: -1;
        }
        .btn:hover {
            color: var(--bg);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -10px color-mix(in srgb, var(--fg) 40%, transparent);
        }
        .btn:hover::before {
            transform: translateY(0);
        }
        .btn.invert {
            background: var(--fg);
            color: var(--bg);
            border-color: var(--fg);
        }
        .btn.invert::before {
            background: var(--bg);
        }
        .btn.invert:hover {
            color: var(--fg);
            box-shadow: 0 15px 25px -10px color-mix(in srgb, var(--fg) 60%, transparent);
        }

        /* ANIMATIONS */
        .fade-up {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 700ms var(--ease-out), transform 700ms var(--ease-out);
        }
        .fade-up.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .fade-up > * { transition: opacity 700ms var(--ease-out), transform 700ms var(--ease-out); opacity: 0; transform: translateY(24px); }
        .fade-up.visible > * { opacity: 1; transform: translateY(0); }
        .fade-up.visible > *:nth-child(1) { transition-delay: 0ms; }
        .fade-up.visible > *:nth-child(2) { transition-delay: 60ms; }
        .fade-up.visible > *:nth-child(3) { transition-delay: 120ms; }
        .fade-up.visible > *:nth-child(4) { transition-delay: 180ms; }
        .fade-up.visible > *:nth-child(5) { transition-delay: 240ms; }
        .fade-up.visible > *:nth-child(6) { transition-delay: 300ms; }

        /* NAVBAR */
        nav {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 100;
            border-bottom: 1px solid var(--border);
            transition: transform 250ms var(--ease-io), opacity 250ms var(--ease-io), backdrop-filter 300ms ease, background-color 300ms ease;
        }
        nav.hidden {
            transform: translateY(-60px);
            opacity: 0;
        }
        nav.scrolled {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background: color-mix(in srgb, var(--bg) 70%, transparent);
        }
        nav:not(.scrolled) {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            background: transparent;
            border-bottom-color: transparent;
        }
        .nav-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 80px;
        }
        .nav-logo {
            font-family: var(--font-serif);
            font-style: italic;
            font-size: 1.5rem;
            color: var(--fg);
            text-decoration: none;
        }
        .nav-logo span.bold { font-weight: 700; }
        .nav-links {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
        }
        .nav-link {
            font-family: var(--font-display);
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.2em;
            color: var(--fg);
            text-decoration: none;
        }
        .nav-link:hover {
            color: var(--fg-muted);
        }
        .hide-mobile { display: block; }
        .show-mobile { display: none; }
        @media (max-width: 768px) {
            .hide-mobile { display: none !important; }
            .show-mobile { display: block !important; }
            .nav-inner { 
                height: 60px; 
                position: relative;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .nav-inner > a { /* The Logo Link */
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                z-index: 10;
                margin: 0 !important;
            }
            .mobile-toggle-wrapper {
                position: relative;
                z-index: 11;
                display: flex;
            }
        }
        @media (min-width: 769px) {
            .mobile-toggle-wrapper { display: none; }
        }

        /* MOBILE MENU */
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
                margin-left: -8px; /* Offset padding for alignment */
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
            gap: var(--spacing-md);
            transform: translateX(100%);
            transition: transform 400ms var(--ease-io);
        }
        .mobile-menu-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: transparent;
            border: none;
            color: var(--fg);
            cursor: pointer;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 300ms var(--ease-io);
            z-index: 110;
        }
        .mobile-menu-close:hover {
            transform: scale(1.1);
            opacity: 0.7;
        }
        .mobile-menu.open {
            transform: translateX(0);
        }
        .mobile-menu .nav-link {
            font-size: 1.2rem;
            letter-spacing: 0.1em;
        }
        .theme-toggle-desktop {
            display: flex;
            align-items: center;
        }
        @media (max-width: 768px) {
            .theme-toggle-desktop { display: none; }
        }

        /* HERO SECTION */
        .hero {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-top: 100px;
            padding-bottom: var(--spacing-xl);
            position: relative;
        }
        .hero-title {
            font-size: clamp(4rem, 12vw, 11rem);
            line-height: 0.9;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: var(--spacing-md);
        }
        .hero-title span { display: block; }
        .hero-sub {
            max-width: 600px;
            font-size: clamp(1rem, 2vw, 1.25rem);
            color: var(--fg-muted);
            margin-bottom: var(--spacing-lg);
        }
        .hero-ctas {
            display: flex;
            gap: var(--spacing-sm);
            flex-wrap: wrap;
            margin-bottom: var(--spacing-xl);
        }
        .hero-terminal {
            font-family: var(--font-mono);
            font-size: 0.9rem;
            color: var(--fg-muted);
            padding: var(--spacing-md);
            max-width: 800px;
            min-height: 220px;
            position: relative;
            border: none;
        }
        .term-border { position: absolute; background: var(--border); }
        .term-border.top { top: 0; left: 0; width: 0%; height: 1px; animation: drawTop 200ms linear 1400ms forwards; }
        .term-border.right { top: 0; right: 0; width: 1px; height: 0%; animation: drawHeight 200ms linear 1660ms forwards; }
        .term-border.bottom { bottom: 0; right: 0; width: 0%; height: 1px; animation: drawTop 200ms linear 1920ms forwards; }
        .term-border.left { bottom: 0; left: 0; width: 1px; height: 0%; animation: drawHeight 200ms linear 2180ms forwards; }
        @keyframes drawTop { to { width: 100%; } }
        @keyframes drawHeight { to { height: 100%; } }

        .cursor-blink {
            animation: blinkAsym 1060ms infinite;
        }
        @keyframes blinkAsym { 0%, 49.9% { opacity: 1; } 50%, 100% { opacity: 0; } }

        .word-mask { display: inline-flex; overflow: hidden; vertical-align: bottom; padding-bottom: 0.1em; margin-bottom: -0.1em; margin-right: 0.25em; }
        .word { display: inline-block; transform: translateY(105%); animation: wordReveal 600ms var(--ease-out) forwards; }
        @keyframes wordReveal { to { transform: translateY(0); } }

        .fade-after { opacity: 0; animation: fadeIn 500ms ease-out 900ms forwards; }
        .btn-fade-up { opacity: 0; transform: translateY(10px); animation: btnFadeUp 400ms var(--ease-out) forwards; }
        @keyframes btnFadeUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { to { opacity: 1; } }

        /* TRUST BAR MARQUEE */
        .trust-bar {
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: var(--spacing-sm) 0;
            overflow: hidden;
            white-space: nowrap;
            display: flex;
            -webkit-mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
            mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
        }
        .marquee {
            font-family: var(--font-display);
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.3em;
            color: var(--fg-muted);
            display: flex;
            width: max-content;
            animation: scroll 35s linear infinite;
            transition: animation-duration 400ms var(--ease-io);
        }
        .trust-bar:hover .marquee {
            animation-duration: 80s;
        }
        @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }

        /* HOW IT WORKS / PROCESS */
        .process { padding: var(--spacing-xl) 0; }
        .process-title {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-style: italic;
            margin-bottom: var(--spacing-lg);
        }
        .process-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border: 1px solid var(--border);
            border-right: none;
        }
        .process-step {
            padding: var(--spacing-lg);
            border-right: 1px solid var(--border);
            position: relative;
            transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
            cursor: default;
        }
        .process-step:hover {
            transform: translateY(-8px);
        }
        .process-step:hover .process-num {
            color: var(--fg);
            transform: scale(1.05) translateX(10px);
        }
        .process-num {
            font-family: var(--font-serif);
            font-size: 6rem;
            color: color-mix(in srgb, var(--fg) 10%, transparent);
            line-height: 1;
            margin-bottom: var(--spacing-sm);
            transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-block;
        }
        .process-step h3 {
            font-family: var(--font-display);
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: var(--spacing-xs);
        }
        .process-step p {
            font-size: 0.9rem;
            color: var(--fg-muted);
        }
        @media (max-width: 900px) {
            .process-grid { grid-template-columns: 1fr; border-right: 1px solid var(--border); border-bottom: none; }
            .process-step { border-right: none; border-bottom: 1px solid var(--border); }
        }

        /* FEATURES / CAPABILITIES */
        .features { padding: var(--spacing-xl) 0; }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border-top: 1px solid var(--border);
            border-left: 1px solid var(--border);
        }
        .feature-cell {
            padding: var(--spacing-lg) var(--spacing-md);
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            position: relative;
            overflow: hidden;
            z-index: 1;
            transition: color 200ms ease;
        }
        .feature-cell::before {
            content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
            background: var(--fg);
            transform-origin: bottom;
            transform: scaleY(0);
            transition: transform 200ms var(--ease-io);
            z-index: -1;
        }
        .feature-cell:hover::before {
            transform: scaleY(1);
            transition: transform 250ms var(--ease-io);
        }
        .feature-cell:hover {
            color: var(--bg);
        }
        .feature-cell:hover .feature-label,
        .feature-cell:hover p {
            color: var(--bg);
        }
        .feature-label, .feature-cell p {
            transition: color 200ms ease;
        }
        .feature-label {
            font-family: var(--font-display);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 700;
            margin-bottom: var(--spacing-sm);
            color: var(--fg);
            display: inline-block;
            transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms ease;
        }
        .feature-cell:hover .feature-label {
            transform: translateX(10px);
        }
        .feature-cell p {
            font-size: 0.95rem;
            color: var(--fg-muted);
        }
        @media (max-width: 900px) {
            .feature-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
            .feature-grid { grid-template-columns: 1fr; }
        }

        /* DEMO MOCKUP */
        .demo { padding: var(--spacing-xl) 0; display: flex; flex-direction: column; align-items: center; }
        .demo-box {
            width: 100%;
            max-width: 600px;
            border: 1px solid var(--border);
            padding: var(--spacing-lg) var(--spacing-xl);
            font-family: var(--font-mono);
            font-size: 0.85rem;
            color: var(--fg);
            position: relative;
            background: color-mix(in srgb, var(--bg) 95%, transparent);
            backdrop-filter: blur(10px);
            box-shadow: 0 0 0 1px color-mix(in srgb, var(--fg) 0%, transparent);
            transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .demo-box:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 25px 50px -12px color-mix(in srgb, var(--fg) 10%, transparent), 0 0 0 1px color-mix(in srgb, var(--fg) 15%, transparent);
            border-color: transparent;
        }
        .demo-box-header { margin-bottom: var(--spacing-md); }
        .demo-box-title { color: var(--fg-faint); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.15em; font-family: var(--font-display); }
        .demo-row { display: flex; justify-content: space-between; border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); padding: 0.6rem 0; }
        .demo-row.no-border { border-bottom: none; }
        .demo-section { margin-top: var(--spacing-lg); color: var(--fg-faint); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.15em; margin-bottom: 0.2rem; font-family: var(--font-display); }
        .demo-box .muted { color: var(--fg-muted); }
        .demo-box .text-green { color: #10b981; }
        .demo-box .text-red { color: #ef4444; }
        .demo-caption {
            font-family: var(--font-sans);
            font-size: 0.8rem;
            color: var(--fg-faint);
            margin-top: var(--spacing-md);
            text-align: center;
        }

        /* PROVIDERS */
        .providers { padding: var(--spacing-xl) 0; }
        .provider-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 0;
            border-top: 1px solid var(--border);
            border-left: 1px solid var(--border);
            border-right: 1px solid var(--border);
        }
        .provider-card {
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: var(--spacing-md) var(--spacing-sm);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            background: var(--bg);
            cursor: pointer;
            z-index: 1;
            min-height: 160px;
        }
        .provider-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: var(--fg);
            transform: scaleY(0);
            transform-origin: bottom;
            transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
            z-index: -1;
        }
        .provider-card:hover::before {
            transform: scaleY(1);
        }
        .provider-icon-wrapper {
            margin-bottom: var(--spacing-sm);
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .provider-card:hover .provider-icon-wrapper {
            transform: translateY(-8px) scale(1.1);
        }
        .provider-logo {
            width: 32px;
            height: 32px;
            object-fit: contain;
            transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1), filter 400ms ease;
        }
        .provider-card:hover .provider-logo {
            transform: scale(1.15);
        }
        /* Adaptive OpenAI logo color for dark/light modes and card hover states */
        .logo-invert {
            filter: invert(1) brightness(2);
        }
        .provider-card:hover .logo-invert {
            filter: invert(0);
        }
        [data-theme="light"] .logo-invert {
            filter: invert(0);
        }
        [data-theme="light"] .provider-card:hover .logo-invert {
            filter: invert(1) brightness(2);
        }

        .provider-name {
            font-family: var(--font-serif);
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 4px;
            color: var(--fg);
            transition: color 400ms ease;
        }
        .provider-card:hover .provider-name {
            color: var(--bg);
        }
        .provider-desc {
            font-size: 0.7rem;
            line-height: 1.4;
            color: var(--fg-muted);
            padding: 0 10px;
            transition: color 400ms ease, opacity 400ms ease;
        }
        .provider-card:hover .provider-desc {
            color: var(--bg);
            opacity: 0.8;
        }
        
        @media (max-width: 900px) {
            .provider-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
            .provider-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* PRICING */
        .pricing { padding: var(--spacing-xl) 0; }
        .pricing-title {
            font-size: clamp(2rem, 4vw, 3rem);
            font-family: var(--font-serif);
            margin-bottom: var(--spacing-lg);
        }
        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--spacing-md);
        }
        .pricing-card {
            border: 1px solid var(--border);
            padding: var(--spacing-lg);
            display: flex;
            flex-direction: column;
            position: relative;
            background: var(--bg);
            transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pricing-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px -15px color-mix(in srgb, var(--fg) 8%, transparent);
            border-color: color-mix(in srgb, var(--fg) 30%, transparent);
        }
        .pricing-card.popular {
            border: 2px solid var(--fg);
        }
        .popular-badge {
            position: absolute;
            top: var(--spacing-sm);
            right: var(--spacing-sm);
            font-family: var(--font-display);
            font-size: 0.6rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border: 1px solid var(--fg);
            padding: 0.2rem 0.5rem;
        }
        .coming-soon-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            font-family: 'Syne', sans-serif;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.15em;
            color: var(--bg);
            background: var(--fg);
            padding: 3px 8px;
            white-space: nowrap;
            z-index: 10;
            text-transform: uppercase;
        }
        .notify-message {
            font-family: 'Inter', sans-serif;
            font-weight: 300;
            font-size: 10px;
            color: color-mix(in srgb, var(--fg) 40%, transparent);
            margin-top: 12px;
            animation: notify-fade 200ms ease-out forwards;
            text-align: center;
        }
        @keyframes notify-fade {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .plan-name {
            font-family: var(--font-display);
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: var(--spacing-sm);
        }
        .plan-price {
            font-family: var(--font-serif);
            font-size: 3.5rem;
            line-height: 1;
            margin-bottom: var(--spacing-md);
        }
        .plan-features {
            list-style: none;
            margin-bottom: var(--spacing-lg);
            flex-grow: 1;
        }
        .plan-features li {
            font-size: 0.9rem;
            color: var(--fg-muted);
            margin-bottom: var(--spacing-xs);
            border-bottom: 1px solid color-mix(in srgb, var(--fg) 5%, transparent);
            padding-bottom: var(--spacing-xs);
        }
        @media (max-width: 900px) {
            .pricing-grid { grid-template-columns: 1fr; }
        }

        /* FAQ */
        .faq { padding: var(--spacing-xl) 0; }
        .faq-title {
            font-size: clamp(2rem, 4vw, 3rem);
            font-family: var(--font-serif);
            font-style: italic;
            margin-bottom: var(--spacing-lg);
        }
        .faq-list {
            border-top: 1px solid var(--border);
        }
        .faq-item {
            border-bottom: 1px solid var(--border);
        }
        .faq-q {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-md) 0;
            background: transparent;
            border: none;
            color: var(--fg);
            font-family: var(--font-display);
            font-size: 1.1rem;
            text-align: left;
            font-weight: 500;
            outline: none;
        }
        .faq-a {
            height: 0;
            overflow: hidden;
            transition: height 350ms var(--ease-io);
        }
        .faq-a p {
            padding-bottom: var(--spacing-md);
            color: var(--fg-muted);
            font-size: 0.95rem;
            opacity: 0;
            transition: opacity 200ms var(--ease-io);
        }
        .faq-item.active .faq-a p {
            opacity: 1;
            transition-delay: 100ms;
        }
        .faq-icon::before {
            content: '+';
            display: block;
            transition: transform 200ms ease;
        }
        .faq-item.active .faq-icon::before {
            transform: rotate(45deg);
        }
        .faq-icon {
            font-family: var(--font-mono);
            font-size: 1.2rem;
        }

        /* FINAL CTA */
        .final-cta {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: var(--spacing-xl) 0;
            position: relative;
        }
        .final-title {
            font-size: clamp(3rem, 7vw, 6rem);
            font-family: var(--font-serif);
            font-style: italic;
            line-height: 1.1;
            margin-bottom: var(--spacing-md);
        }
        .final-title span { display: block; }
        .final-sub {
            font-size: 1.1rem;
            color: var(--fg-muted);
            margin-bottom: var(--spacing-lg);
        }
        
        /* NOISE TEXTURE */
        .noise {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            pointer-events: none;
            z-index: 999;
            opacity: 0.04;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* FOOTER */
        footer {
            border-top: 1px solid var(--border);
            padding: var(--spacing-lg) 0 var(--spacing-md);
        }
        .footer-inner {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-lg);
        }
        .footer-logo {
            font-family: var(--font-serif);
            font-style: italic;
            font-size: 1.5rem;
            margin-bottom: var(--spacing-xs);
        }
        .footer-logo span.bold { font-weight: 700; }
        .footer-tagline {
            font-size: 0.8rem;
            color: var(--fg-faint);
        }
        .footer-links {
            display: flex;
            gap: var(--spacing-md);
        }
        .footer-links a {
            font-family: var(--font-display);
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.1em;
            color: var(--fg-muted);
            text-decoration: none;
        }
        .footer-links a:hover { color: var(--fg); }
        .footer-bottom {
            border-top: 1px solid color-mix(in srgb, var(--fg) 5%, transparent);
            padding-top: var(--spacing-md);
            font-size: 0.75rem;
            color: var(--fg-faint);
            text-align: center;
        }

        /* SELECTION */
        .landing-theme ::selection { background: var(--fg); color: var(--bg); }
        .landing-theme ::-moz-selection { background: var(--fg); color: var(--bg); }

        /* CONTACT SECTION */
        .contact {
            max-width: 1400px;
            margin: 0 auto;
            padding: 80px 48px;
            border-top: 1px solid color-mix(in srgb, var(--fg) 8%, transparent);
            border-bottom: 1px solid color-mix(in srgb, var(--fg) 8%, transparent);
        }
        .contact-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .contact-left {
            flex: 0 0 60%;
        }
        .contact-label {
            display: block;
            font-family: var(--font-display);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.2em;
            color: color-mix(in srgb, var(--fg) 35%, transparent);
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        .contact-headline {
            font-family: var(--font-serif);
            font-style: italic;
            font-size: 32px;
            color: var(--fg);
            margin-bottom: 8px;
        }
        .contact-subtext {
            font-family: var(--font-sans);
            font-weight: 300;
            font-size: 14px;
            color: color-mix(in srgb, var(--fg) 45%, transparent);
            line-height: 1.7;
        }
        .contact-right {
            flex: 0 0 40%;
        }
        .contact-divider {
            height: 1px;
            background: color-mix(in srgb, var(--fg) 8%, transparent);
            margin: 40px 0;
        }
        .contact-items-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px 24px;
            border: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
            text-decoration: none;
            transition: all 200ms var(--ease-io);
        }
        .contact-item:hover {
            border-color: color-mix(in srgb, var(--fg) 35%, transparent);
            background: color-mix(in srgb, var(--fg) 2%, transparent);
        }
        .contact-text-block {
            display: flex;
            flex-direction: column;
        }
        .contact-item-label {
            font-family: var(--font-display);
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.15em;
            color: color-mix(in srgb, var(--fg) 30%, transparent);
            display: block;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .contact-value {
            font-family: var(--font-mono);
            font-size: 13px;
            color: color-mix(in srgb, var(--fg) 70%, transparent);
            display: block;
            transition: color 200ms var(--ease-io);
        }
        .contact-item:hover .contact-value {
            color: var(--fg);
        }
        .contact-note {
            font-family: var(--font-sans);
            font-weight: 300;
            font-size: 11px;
            color: color-mix(in srgb, var(--fg) 25%, transparent);
            margin-top: 16px;
            text-align: left;
        }
        @media (max-width: 768px) {
            .contact {
                padding: 48px 24px;
            }
            .contact-headline {
                font-size: 24px;
            }
            .contact-items-container {
                grid-template-columns: 1fr;
            }
            .contact-left {
                flex: 0 0 100%;
            }
        }

        /* BG LOGO WATERMARK */
        .bg-logo-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80vw;
            height: 80vh;
            opacity: 0.05;
            pointer-events: none;
            z-index: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: opacity 1s ease;
        }
        .bg-logo-watermark svg {
            width: 100%;
            height: 100%;
            max-width: 900px;
            max-height: 900px;
        }
        [data-theme='light'] .bg-logo-watermark {
            opacity: 0.04;
        }
        @media (max-width: 768px) {
            .bg-logo-watermark svg {
                max-width: 350px;
                max-height: 350px;
            }
            .bg-logo-watermark {
                opacity: 0.03; /* Slightly softer on mobile to maintain readability */
            }
            [data-theme='light'] .bg-logo-watermark {
                opacity: 0.02;
            }
        }

    ` }} />


            <div className="noise"></div>
            
            <div className="bg-logo-watermark">
                <svg
                    viewBox="3.5 0 28 40"
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
            </div>
            <nav id="navbar" ref={navRef}>
                <div className="container nav-inner">
                    <div className="mobile-toggle-wrapper">
                        <button 
                            className="mobile-toggle" 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                            )}
                        </button>
                    </div>

                    <Link href="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        textDecoration: 'none'
                    }} data-hover="true">
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
                            fontFamily: "'Libre Baskerville', Georgia, serif",
                            fontStyle: 'italic',
                            fontWeight: 700,
                            fontSize: '32px',
                            color: 'var(--fg)',
                            letterSpacing: '0.5px',
                            lineHeight: 1,
                            transition: 'all 300ms ease'
                        }}>CapMap</span>
                    </Link>

                    <div className="nav-links">
                        <a href="#process" className="nav-link hide-mobile" data-hover="true">Process</a>
                        <a href="#features" className="nav-link hide-mobile" data-hover="true">Capabilities</a>
                        <a href="#providers" className="nav-link hide-mobile" data-hover="true">Providers</a>
                        <a href="#pricing" className="nav-link hide-mobile" data-hover="true">Pricing</a>
                        <a href="#faq" className="nav-link hide-mobile" data-hover="true">FAQ</a>
                        <a href="#contact" className="nav-link hide-mobile" data-hover="true">Contact</a>
                        <div className="theme-toggle-desktop">
                            <ThemeToggle />
                        </div>
                        <Link href="/app" className="btn" style={{ padding: "0.45rem 1rem", fontSize: "0.6rem", display: 'flex', alignItems: 'center', justifyContent: 'center' }} data-hover="true">
                            <span className="hide-mobile">Analyze Key</span>
                            <span className="show-mobile" style={{ fontSize: '1.2rem', lineHeight: 1 }}>→</span>
                        </Link>
                    </div>
                </div>

                <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                    <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)} aria-label="Close Menu">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                    <a href="#process" className="nav-link" onClick={() => setIsMenuOpen(false)}>Process</a>
                    <a href="#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>Capabilities</a>
                    <a href="#providers" className="nav-link" onClick={() => setIsMenuOpen(false)}>Providers</a>
                    <a href="#pricing" className="nav-link" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                    <a href="#faq" className="nav-link" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                    <a href="#contact" className="nav-link" onClick={() => setIsMenuOpen(false)}>Contact</a>
                    <div style={{ marginTop: '20px' }}>
                        <ThemeToggle />
                    </div>
                    <Link href="/app" className="btn invert" onClick={() => setIsMenuOpen(false)} style={{ marginTop: '20px' }}>Analyze Key</Link>
                </div>
            </nav>

            <div className="container">
                <header className="hero">
                    <h1 className="hero-title hero-stagger">
                        <div className="word-mask"><span className="word" style={{ animationDelay: '0ms' }}>Know</span></div>
                        <div className="word-mask"><span className="word" style={{ animationDelay: '80ms' }}>Exactly</span></div>
                        <div className="word-mask"><span className="word" style={{ animationDelay: '160ms' }}>What</span></div><br />
                        <div className="word-mask"><span className="word" style={{ animationDelay: '240ms' }}>Your</span></div>
                        <div className="word-mask"><span className="word" style={{ animationDelay: '320ms' }}>API</span></div>
                        <div className="word-mask"><span className="word" style={{ animationDelay: '400ms' }}>Key</span></div><br />
                        <div className="word-mask"><span className="word" style={{ animationDelay: '480ms' }}>Unlocks</span></div>
                        <div className="word-mask"><span className="word" style={{ animationDelay: '680ms' }}>.</span></div>
                    </h1>
                    <p className="hero-sub fade-after">
                        Paste your key. CapMap reveals every model, capability, and permission it unlocks. Instantly. Securely. Free.
                    </p>
                    <div className="hero-ctas">
                        <Link href="/app" className="btn invert btn-fade-up" style={{ animationDelay: '1100ms' }} data-hover="true">Analyze Your Key &rarr;</Link>
                        <a href="https://github.com/jaggureddy11/API-CAPABILITY-DISCOVERY" className="btn btn-fade-up" style={{ 
                            animationDelay: '1180ms', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '10px' 
                        }} target="_blank" data-hover="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            View on GitHub
                        </a>
                    </div>

                    <div className="hero-terminal" id="terminal-block" data-hover="true">
                        <span className="term-border top"></span>
                        <span className="term-border right"></span>
                        <span className="term-border bottom"></span>
                        <span className="term-border left"></span>
                        <div id="typewriter" ref={typewriterRef}></div>
                    </div>
                </header>
            </div>

            <div className="trust-bar fade-up">
                <div className="marquee">
                    <div className="marquee-content">
                        WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &middot; &nbsp; PERPLEXITY &nbsp; &nbsp; &nbsp;
                        WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &middot; &nbsp; PERPLEXITY &nbsp; &nbsp; &nbsp;
                    </div>
                    <div className="marquee-content" aria-hidden="true">
                        WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &middot; &nbsp; PERPLEXITY &nbsp; &nbsp; &nbsp;
                        WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &middot; &nbsp; PERPLEXITY &nbsp; &nbsp; &nbsp;
                    </div>
                </div>
            </div>

            <div className="container">
                <section id="process" className="process fade-up">
                    <span className="section-label">Process</span>
                    <h2 className="process-title">Three steps to full clarity.</h2>

                    <div className="process-grid">
                        <div className="process-step" data-hover="true">
                            <div className="process-num">01</div>
                            <h3 className="display">Paste Key</h3>
                            <p>Provide your token securely. Memory processing ensures nothing is logged or kept.</p>
                        </div>
                        <div className="process-step" data-hover="true">
                            <div className="process-num">02</div>
                            <h3 className="display">Run Discovery</h3>
                            <p>Our engine actively tests standard endpoints to definitively prove capabilities.</p>
                        </div>
                        <div className="process-step" data-hover="true">
                            <div className="process-num">03</div>
                            <h3 className="display">See Everything</h3>
                            <p>Review allowed models, rate limits, and actual permission denials transparently.</p>
                        </div>
                    </div>
                </section>

                <section id="features" className="features fade-up">
                    <span className="section-label">Capabilities</span>
                    <div className="feature-grid">
                        <div className="feature-cell" data-hover="true">
                            <div className="feature-label">Key Validation</div>
                            <p>Instantly confirm your key is active and practically usable for generation tasks.</p>
                        </div>
                        <div className="feature-cell" data-hover="true">
                            <div className="feature-label">Model Discovery</div>
                            <p>See every precise model variation your specific API tier genuinely unlocks.</p>
                        </div>
                        <div className="feature-cell" data-hover="true">
                            <div className="feature-label">Capability Detection</div>
                            <p>Text, embeddings, image, audio &mdash; all verified with micro live endpoint tests.</p>
                        </div>
                        <div className="feature-cell" data-hover="true">
                            <div className="feature-label">Permission Testing</div>
                            <p>We trigger real HTTP hits, not heuristic guesswork, for 100% accuracy.</p>
                        </div>
                        <div className="feature-cell" data-hover="true">
                            <div className="feature-label">Rate Limit Analysis</div>
                            <p>Pull and decode hidden API token tracking straight from live response headers.</p>
                        </div>
                        <div className="feature-cell" data-hover="true">
                            <div className="feature-label">Cost Estimation</div>
                            <p>Calculate realistic spend metrics depending on your tested model allowances.</p>
                        </div>
                    </div>
                </section>

                <section className="demo fade-up">
                    <div className="demo-box" data-hover="true">
                        <div className="demo-box-header">
                            <div className="demo-box-title">CAPMAP &mdash; CAPABILITY REPORT</div>
                        </div>

                        <div className="demo-row">
                            <span className="muted">Provider</span>
                            <span>OpenAI</span>
                        </div>
                        <div className="demo-row no-border">
                            <span className="muted">Key Status</span>
                            <span className="text-green">● Valid</span>
                        </div>

                        <div className="demo-section">Models</div>
                        <div className="demo-row">
                            <span>✓ gpt-4o</span>
                            <span className="muted">[128k] [$5/1M]</span>
                        </div>
                        <div className="demo-row">
                            <span>✓ gpt-4-turbo</span>
                            <span className="muted">[128k] [$10/1M]</span>
                        </div>
                        <div className="demo-row no-border">
                            <span className="muted">✗ gpt-4o-realtime</span>
                            <span className="muted">[—] <span className="text-red">[Denied]</span></span>
                        </div>

                        <div className="demo-section">Capabilities</div>
                        <div className="demo-row">
                            <span>✓ Text Generation</span>
                            <span className="muted"></span>
                        </div>
                        <div className="demo-row">
                            <span>✓ Embeddings</span>
                            <span className="muted"></span>
                        </div>
                        <div className="demo-row">
                            <span>✓ Image Generation</span>
                            <span className="muted"></span>
                        </div>
                        <div className="demo-row no-border">
                            <span className="muted">✗ Audio Transcription</span>
                            <span className="text-red">[Denied]</span>
                        </div>
                    </div>
                    <div className="demo-caption">Actual output format from a live API key scan</div>
                </section>

                <section id="providers" className="providers fade-up">
                    <span className="section-label">Providers</span>
                    <div className="provider-grid">
                        <div className="provider-card" data-hover="true">
                            <div className="provider-icon-wrapper">
                                <img src="https://svgl.app/library/openai.svg" alt="OpenAI logo" className="provider-logo logo-invert" />
                            </div>
                            <div className="provider-name">OpenAI</div>
                            <div className="provider-desc">GPT, DALL-E, Embeddings, Whisper</div>
                        </div>
                        <div className="provider-card" data-hover="true">
                            <div className="provider-icon-wrapper">
                                <img src="https://svgl.app/library/gemini.svg" alt="Google Gemini logo" className="provider-logo" />
                            </div>
                            <div className="provider-name">Google Gemini</div>
                            <div className="provider-desc">1.5 Pro, Flash, Imagen, Embeddings</div>
                        </div>
                        <div className="provider-card" data-hover="true">
                            <div className="provider-icon-wrapper">
                                <img src="https://cdn.simpleicons.org/anthropic/ccb4a1" alt="Anthropic logo" className="provider-logo" />
                            </div>
                            <div className="provider-name">Anthropic</div>
                            <div className="provider-desc">Claude 3.5 Sonnet, Opus, Haiku</div>
                        </div>
                        <div className="provider-card" data-hover="true">
                            <div className="provider-icon-wrapper">
                                <img src="https://svgl.app/library/groq.svg" alt="Groq logo" className="provider-logo" />
                            </div>
                            <div className="provider-name">Groq</div>
                            <div className="provider-desc">Llama 3, Mixtral, Gemma, Whisper</div>
                        </div>
                        <div className="provider-card" style={{ borderRight: 'none' }} data-hover="true">
                            <div className="provider-icon-wrapper">
                                <img src="https://svgl.app/library/perplexity.svg" alt="Perplexity logo" className="provider-logo" />
                            </div>
                            <div className="provider-name">Perplexity</div>
                            <div className="provider-desc">Sonar, Sonar Pro, Reasoning, Web Search</div>
                        </div>
                    </div>
                </section>

                <section id="pricing" className="pricing fade-up">
                    <span className="section-label">Pricing</span>
                    <h2 className="pricing-title">Simple. Transparent. Fair.</h2>

                    <div className="pricing-grid">
                        <div className="pricing-card" data-hover="true">
                            <div className="plan-name">FREE</div>
                            <div className="plan-price">$0</div>
                            <ul className="plan-features">
                                <li>✓ 25 key checks / month</li>
                                <li>✓ All 5 providers supported</li>
                                <li>✓ Basic AI features</li>
                                <li>✓ Cost Estimator</li>
                                <li>✓ No account required</li>
                            </ul>
                            <Link href="/app" className="btn">Get Started →</Link>
                        </div>

                        <div className="pricing-card" data-hover="true">
                            <div className="coming-soon-badge">COMING SOON</div>
                            <div className="plan-name">DEV</div>
                            <div className="plan-price">$5<span style={{ fontSize: "1rem", fontFamily: "var(--font-sans)" }}>/mo</span></div>
                            <ul className="plan-features">
                                <li>✓ Unlimited key checks</li>
                                <li>✓ Save up to 10 keys</li>
                                <li>✓ Full scan history</li>
                                <li>✓ Email alerts when key expires</li>
                                <li>✓ Advanced AI features</li>
                                <li>✓ Priority support</li>
                            </ul>
                            <button className="btn invert" onClick={() => setNotifiedDev(true)}>Notify Me</button>
                            {notifiedDev && <div className="notify-message">We'll notify you at launch.</div>}
                        </div>

                        <div className="pricing-card" data-hover="true">
                            <div className="coming-soon-badge">COMING SOON</div>
                            <div className="plan-name">TEAM</div>
                            <div className="plan-price">$15<span style={{ fontSize: "1rem", fontFamily: "var(--font-sans)" }}>/mo</span></div>
                            <ul className="plan-features">
                                <li>✓ Everything in Dev</li>
                                <li>✓ Unlimited keys</li>
                                <li>✓ Team sharing</li>
                                <li>✓ API access</li>
                                <li>✓ Custom integrations</li>
                                <li>✓ Dedicated support</li>
                            </ul>
                            <button className="btn" onClick={() => setNotifiedTeam(true)}>Notify Me</button>
                            {notifiedTeam && <div className="notify-message">We'll notify you at launch.</div>}
                        </div>
                    </div>

                    <div style={{
                        marginTop: '24px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 300,
                        fontSize: '11px',
                        color: 'var(--fg)',
                        opacity: 0.3
                    }}>
                        * Free tier resets every 30 days. No credit card required.
                    </div>
                </section>

                <section id="faq" className="faq fade-up">
                    <span className="section-label">FAQ</span>
                    <h2 className="faq-title">Questions, answered.</h2>

                    <div className="faq-list">
                        <div className="faq-item">
                            <button className="faq-q" data-hover="true">
                                Is my API key safe?
                                <span className="faq-icon"></span>
                            </button>
                            <div className="faq-a">
                                <p>Yes. Keys are strictly processed in volatile runtime memory and immediately discarded after testing. We write absolutely nothing to persistent databases or server logs.</p>
                            </div>
                        </div>
                        <div className="faq-item">
                            <button className="faq-q" data-hover="true">
                                How does browser-safe mode work?
                                <span className="faq-icon"></span>
                            </button>
                            <div className="faq-a">
                                <p>For providers that support open CORS (like Gemini), we bypass our backend entirely. The network fetch happens straight from your client window directly to the provider&apos;s endpoint.</p>
                            </div>
                        </div>
                        <div className="faq-item">
                            <button className="faq-q" data-hover="true">
                                Which providers are supported?
                                <span className="faq-icon"></span>
                            </button>
                            <div className="faq-a">
                                <p>We currently natively decode universally recognized keys from OpenAI, Google Gemini, Anthropic, Groq, and Perplexity by examining their distinct prefix signatures.</p>
                            </div>
                        </div>
                        <div className="faq-item">
                            <button className="faq-q" data-hover="true">
                                Is the source code open?
                                <span className="faq-icon"></span>
                            </button>
                            <div className="faq-a">
                                <p>The core capability discovery engine is fully open source. You can view, audit, or host the underlying tests yourself by visiting our GitHub repository.</p>
                            </div>
                        </div>
                        <div className="faq-item">
                            <button className="faq-q" data-hover="true">
                                Do you log or store anything?
                                <span className="faq-icon"></span>
                            </button>
                            <div className="faq-a">
                                <p>Zero logging. As developers ourselves, we structured the architecture to inherently prevent caching, analytics tracking, or environment variable leaks.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="cta" className="final-cta fade-up">
                    <h2 className="final-title">
                        <span>Your key.</span>
                        <span>Your capabilities.</span>
                        <span>Fully visible.</span>
                    </h2>
                    <p className="final-sub">No more guessing which endpoints are enabled on your tier.</p>
                    <Link href="/app" className="btn invert" style={{ marginTop: "var(--spacing-sm)" }} data-hover="true">Analyze Your Key Free &rarr;</Link>
                </section>

                <section id="contact" className="contact fade-up">
                    <div className="contact-top">
                        <div className="contact-left">
                            <span className="contact-label">CONTACT</span>
                            <h2 className="contact-headline">Have a question or feedback?</h2>
                            <p className="contact-subtext">Reach out directly — I read every message.</p>
                        </div>
                        <div className="contact-right"></div>
                    </div>
                    
                    <div className="contact-divider"></div>
                    
                    <div className="contact-items-container">
                        <a href="mailto:jaggureddy2004@gmail.com" target="_blank" rel="noopener noreferrer" className="contact-item" data-hover="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M2 7l10 7 10-7"/>
                            </svg>
                            <div className="contact-text-block">
                                <span className="contact-item-label">EMAIL</span>
                                <span className="contact-value">jaggureddy2004@gmail.com</span>
                            </div>
                        </a>
                        
                        <a href="https://www.linkedin.com/in/jaggureddy/" target="_blank" rel="noopener noreferrer" className="contact-item" data-hover="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            <div className="contact-text-block">
                                <span className="contact-item-label">LINKEDIN</span>
                                <span className="contact-value">linkedin.com/in/jaggureddy/</span>
                            </div>
                        </a>
                    </div>
                    
                    <p className="contact-note">Usually responds within 24 hours.</p>
                </section>

                <footer>
                    <div className="footer-inner">
                        <div>
                            <Link href="/" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                textDecoration: 'none',
                                marginBottom: '12px'
                            }} data-hover="true">
                                <svg
                                    width="28"
                                    height="36"
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
                                <span style={{
                                    fontFamily: "'Libre Baskerville', Georgia, serif",
                                    fontStyle: 'italic',
                                    fontWeight: 700,
                                    fontSize: '26px',
                                    color: 'var(--fg)',
                                    letterSpacing: '0.5px',
                                    lineHeight: 1
                                }}>CapMap</span>
                            </Link>
                            <div className="footer-tagline">Mapping every capability your API key unlocks.</div>
                        </div>
                        <div className="footer-links">
                            <a href="https://github.com/jaggureddy11/API-CAPABILITY-DISCOVERY" data-hover="true" target="_blank">GitHub</a>
                            <a href="#" data-hover="true">Docs</a>
                            <a href="#" data-hover="true">Privacy</a>
                            <a href="#" data-hover="true">Terms</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span style={{ opacity: 0.4 }}>&copy; 2026 CapMap &mdash; Built for developers. Trusted by engineers.</span>
                    </div>
                </footer>
            </div>


        </div>
    );
}
