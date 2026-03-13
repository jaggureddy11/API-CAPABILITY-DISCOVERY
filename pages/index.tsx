import React, { useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function LandingPage() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);
    const typewriterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Custom Cursor
        const cursor = cursorRef.current;
        if (!cursor) return;

        const hoverElements = document.querySelectorAll('[data-hover], a, button');
        
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let cursorX = mouseX;
        let cursorY = mouseY;
        
        const t1 = document.getElementById('t1');
        const t2 = document.getElementById('t2');
        const t3 = document.getElementById('t3');
        const trail1 = { x: mouseX, y: mouseY };
        const trail2 = { x: mouseX, y: mouseY };
        const trail3 = { x: mouseX, y: mouseY };

        const moveCursor = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        let rafId: number;
        const renderCursor = () => {
            cursorX += (mouseX - cursorX) * 0.12;
            cursorY += (mouseY - cursorY) * 0.12;
            
            trail1.x += (cursorX - trail1.x) * 0.2;
            trail1.y += (cursorY - trail1.y) * 0.2;
            trail2.x += (trail1.x - trail2.x) * 0.2;
            trail2.y += (trail1.y - trail2.y) * 0.2;
            trail3.x += (trail2.x - trail3.x) * 0.2;
            trail3.y += (trail2.y - trail3.y) * 0.2;

            cursor.style.transform = `translate(calc(-50% + ${cursorX}px), calc(-50% + ${cursorY}px))`;
            if (t1) t1.style.transform = `translate(calc(-50% + ${trail1.x}px), calc(-50% + ${trail1.y}px))`;
            if (t2) t2.style.transform = `translate(calc(-50% + ${trail2.x}px), calc(-50% + ${trail2.y}px))`;
            if (t3) t3.style.transform = `translate(calc(-50% + ${trail3.x}px), calc(-50% + ${trail3.y}px))`;
            rafId = requestAnimationFrame(renderCursor);
        };
        rafId = requestAnimationFrame(renderCursor);

        document.addEventListener('mousemove', moveCursor);

        const handleMouseEnter = () => { cursor.classList.add('hovering'); [t1, t2, t3].forEach(t => t?.classList.add('hidden')); };
        const handleMouseLeave = () => { cursor.classList.remove('hovering'); [t1, t2, t3].forEach(t => t?.classList.remove('hidden')); };
        const handleMouseDown = () => cursor.classList.add('clicking');
        const handleMouseUp = () => cursor.classList.remove('clicking');

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

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
        const lines = [
            "> Validating key... ✓",
            "> Provider detected: OpenAI",
            "> Fetching models... ✓",
            "> gpt-4o ✓  gpt-4-turbo ✓  gpt-3.5-turbo ✓",
            "> Capabilities: Text ✓  Embeddings ✓  Images ✓",
            "> Rate limit: 10,000 req/day"
        ];
        
        let lineIdx = 0;
        let charIdx = 0;
        let charsTyped = 0;
        let timeoutId: ReturnType<typeof setTimeout>;
        
        const typeWriter = () => {
            const el = typewriterRef.current;
            if (!el) return;
            
            if (lineIdx < lines.length) {
                if (charIdx === 0 && lineIdx > 0) {
                    el.innerHTML += '<br />';
                }
                
                if (charIdx < lines[lineIdx].length) {
                    el.innerHTML += lines[lineIdx].charAt(charIdx);
                    charIdx++;
                    charsTyped++;
                    
                    let delay = Math.random() * 17 + 28;
                    if (lines[lineIdx].includes('✓') && !lines[lineIdx].startsWith('> ✓')) delay = 45;
                    else if (lines[lineIdx].startsWith('>')) delay = 20;
                    
                    if (charsTyped % (Math.floor(Math.random() * 3) + 3) === 0) delay += Math.random() * 100 + 50;
                    
                    timeoutId = setTimeout(typeWriter, delay);
                } else {
                    lineIdx++;
                    charIdx = 0;
                    timeoutId = setTimeout(typeWriter, 400);
                }
            }
        };
        
        timeoutId = setTimeout(typeWriter, 2400);

        return () => {
            cancelAnimationFrame(rafId);
            document.removeEventListener('mousemove', moveCursor);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('scroll', handleScroll);
            hoverElements.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnter);
                el.removeEventListener('mouseleave', handleMouseLeave);
            });
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
            
            if(!btn || !answer) return;

            const handler = () => {
                const isActive = item.classList.contains('active');
                
                // close all
                faqItems.forEach(faq => {
                    faq.classList.remove('active');
                    const a = faq.querySelector('.faq-a') as HTMLElement;
                    if(a && faq !== item) {
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
                if(btn && clickHandlers.has(btn)) {
                    btn.removeEventListener('click', clickHandlers.get(btn));
                }
            });
        };
    }, []);

    return (
        <div className="landing-theme">
            <Head>
                <title>APILens | Capability Discovery Engine</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=JetBrains+Mono&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;500;700&display=swap" rel="stylesheet" />
            </Head>
            <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --bg: #000000;
            --fg: #ffffff;
            --fg-muted: rgba(255, 255, 255, 0.6);
            --fg-faint: rgba(255, 255, 255, 0.4);
            --border: rgba(255, 255, 255, 0.15);
            --border-strong: rgba(255, 255, 255, 0.4);
            
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
            cursor: none; /* Custom cursor everywhere */
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

        /* CUSTOM CURSOR */
        .cursor-trail {
            width: 6px; height: 6px; background: var(--fg); border-radius: 50%;
            position: fixed; pointer-events: none; z-index: 9998;
            top: 0; left: 0;
            transition: opacity 0.2s;
        }
        .cursor-trail.t1 { opacity: 0.3; } .cursor-trail.t2 { opacity: 0.15; } .cursor-trail.t3 { opacity: 0.08; }
        .cursor-trail.hidden { opacity: 0; }

        .cursor {
            width: 6px; height: 6px; background: var(--fg); border-radius: 50%;
            position: fixed; pointer-events: none; z-index: 9999;
            top: 0; left: 0;
            transition: width 0.2s, height 0.2s, background-color 0.2s, border 0.2s, mix-blend-mode 0.2s;
        }
        .cursor.hovering {
            width: 40px; height: 40px; background: rgba(255, 255, 255, 1); border: 0.5px solid var(--fg); mix-blend-mode: difference;
        }
        .cursor.clicking {
            transform: scale(0.8) !important;
            transition: transform 150ms var(--ease-out), width 0.2s, height 0.2s, background-color 0.2s !important;
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
            transition: background 0s, color 0s;
            font-weight: 700;
        }
        .btn:hover {
            background: var(--fg);
            color: var(--bg);
        }
        .btn.invert {
            background: var(--fg);
            color: var(--bg);
        }
        .btn.invert:hover {
            background: transparent;
            color: var(--fg);
            border-color: var(--fg);
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
            background: rgba(0, 0, 0, 0.7);
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
        @media (max-width: 768px) {
            .nav-link.hide-mobile { display: none; }
            .nav-inner { height: 60px; }
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
        }
        .process-num {
            font-family: var(--font-serif);
            font-size: 6rem;
            color: rgba(255, 255, 255, 0.1);
            line-height: 1;
            margin-bottom: var(--spacing-sm);
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
        .demo { padding: var(--spacing-xl) 0; }
        .demo-box {
            border: 1px solid var(--border);
            padding: var(--spacing-md);
            font-family: var(--font-mono);
            font-size: 0.9rem;
            color: var(--fg);
            line-height: 1.8;
            overflow-x: auto;
            white-space: pre;
        }
        .demo-box span.green { color: var(--fg); } /* No color, just standard */
        .demo-box span.muted { color: var(--fg-faint); }
        .demo-caption {
            font-family: var(--font-sans);
            font-size: 0.8rem;
            color: var(--fg-faint);
            margin-top: var(--spacing-sm);
            text-align: right;
        }

        /* PROVIDERS */
        .providers { padding: var(--spacing-xl) 0; }
        .provider-row {
            display: flex;
            border: 1px solid var(--border);
            border-right: none;
        }
        .provider-cell {
            flex: 1;
            padding: var(--spacing-lg) var(--spacing-md);
            border-right: 1px solid var(--border);
            transition: background 0s, color 0s;
        }
        .provider-cell:hover {
            background: var(--fg);
            color: var(--bg);
        }
        .provider-cell:hover .provider-name,
        .provider-cell:hover .provider-desc {
            color: var(--bg);
        }
        .provider-name {
            font-family: var(--font-serif);
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: var(--spacing-xs);
        }
        .provider-desc {
            font-size: 0.85rem;
            color: var(--fg-muted);
        }
        @media (max-width: 900px) {
            .provider-row { flex-direction: column; border-right: 1px solid var(--border); border-bottom: none; }
            .provider-cell { border-right: none; border-bottom: 1px solid var(--border); }
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
            border-bottom: 1px solid rgba(255,255,255,0.05);
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
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: var(--spacing-md);
            font-size: 0.75rem;
            color: var(--fg-faint);
            text-align: center;
        }

        /* SELECTION */
        .landing-theme ::selection { background: var(--fg); color: var(--bg); }
        .landing-theme ::-moz-selection { background: var(--fg); color: var(--bg); }

    ` }} />


    <div className="noise"></div>
    <div className="cursor-trail t3" id="t3"></div>
    <div className="cursor-trail t2" id="t2"></div>
    <div className="cursor-trail t1" id="t1"></div>
    <div className="cursor" id="cursor" ref={cursorRef}></div>

    <nav id="navbar" ref={navRef}>
        <div className="container nav-inner">
            <a href="#" className="nav-logo" data-hover="true">APILens</a>
            <div className="nav-links">
                <a href="#process" className="nav-link hide-mobile" data-hover="true">Process</a>
                <a href="#features" className="nav-link hide-mobile" data-hover="true">Capabilities</a>
                <a href="#pricing" className="nav-link hide-mobile" data-hover="true">Pricing</a>
                <Link href="/app" className="btn" style={{padding: "0.6rem 1.2rem", fontSize: "0.65rem"}} data-hover="true">Analyze Key</Link>
            </div>
        </div>
    </nav>

    <div className="container">
        <header className="hero">
            <h1 className="hero-title hero-stagger">
                <div className="word-mask"><span className="word" style={{animationDelay: '0ms'}}>Know</span></div>
                <div className="word-mask"><span className="word" style={{animationDelay: '80ms'}}>Exactly</span></div>
                <div className="word-mask"><span className="word" style={{animationDelay: '160ms'}}>What</span></div><br/>
                <div className="word-mask"><span className="word" style={{animationDelay: '240ms'}}>Your</span></div>
                <div className="word-mask"><span className="word" style={{animationDelay: '320ms'}}>API</span></div>
                <div className="word-mask"><span className="word" style={{animationDelay: '400ms'}}>Key</span></div><br/>
                <div className="word-mask"><span className="word" style={{animationDelay: '480ms'}}>Unlocks</span></div>
                <div className="word-mask"><span className="word" style={{animationDelay: '680ms'}}>.</span></div>
            </h1>
            <p className="hero-sub fade-after">
                Paste your key. Discover models, capabilities, and permissions instantly. Your key never leaves your browser.
            </p>
            <div className="hero-ctas">
                <Link href="/app" className="btn invert btn-fade-up" style={{animationDelay: '1100ms'}} data-hover="true">Analyze Your Key &rarr;</Link>
                <a href="https://github.com/jaggureddy11/API-CAPABILITY-DISCOVERY" className="btn btn-fade-up" style={{animationDelay: '1180ms'}} target="_blank" data-hover="true">View on GitHub</a>
            </div>
            
            <div className="hero-terminal" id="terminal-block" data-hover="true">
                <span className="term-border top"></span>
                <span className="term-border right"></span>
                <span className="term-border bottom"></span>
                <span className="term-border left"></span>
                <div id="typewriter" ref={typewriterRef}></div><span className="cursor-blink">█</span>
            </div>
        </header>
    </div>

    <div className="trust-bar fade-up">
        <div className="marquee">
            <div className="marquee-content">
                WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &nbsp; &nbsp; 
                WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &nbsp; &nbsp;
            </div>
            <div className="marquee-content" aria-hidden="true">
                WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &nbsp; &nbsp; 
                WORKS WITH &nbsp; OPENAI &nbsp; &middot; &nbsp; GOOGLE GEMINI &nbsp; &middot; &nbsp; ANTHROPIC &nbsp; &middot; &nbsp; GROQ &nbsp; &nbsp; &nbsp;
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
┌─────────────────────────────────────┐
│  APILens &mdash; Capability Report        │
│  Provider   : OpenAI                │
│  Key Status : ● Valid               │
├─────────────────────────────────────┤
│  MODELS                             │
│  ✓ gpt-4o          [128k] [$5/1M]   │
│  ✓ gpt-4-turbo     [128k] [$10/1M]  │
│  <span className="muted">✗ gpt-4o-realtime [—]   [Denied]</span>   │
├─────────────────────────────────────┤
│  CAPABILITIES                       │
│  ✓ Text Generation                  │
│  ✓ Embeddings                       │
│  ✓ Image Generation                 │
│  <span className="muted">✗ Audio Transcription  [Denied]</span>    │
└─────────────────────────────────────┘
            </div>
            <div className="demo-caption">Actual output format from a live API key scan</div>
        </section>

        <section className="providers fade-up">
            <span className="section-label">Providers</span>
            <div className="provider-row">
                <div className="provider-cell" data-hover="true">
                    <div className="provider-name">OpenAI</div>
                    <div className="provider-desc">GPT, DALL-E, Embeddings, Whisper</div>
                </div>
                <div className="provider-cell" data-hover="true">
                    <div className="provider-name">Google Gemini</div>
                    <div className="provider-desc">1.5 Pro, Flash, Imagen, Embeddings</div>
                </div>
                <div className="provider-cell" data-hover="true">
                    <div className="provider-name">Anthropic</div>
                    <div className="provider-desc">Claude 3.5 Sonnet, Opus, Haiku</div>
                </div>
                <div className="provider-cell" data-hover="true">
                    <div className="provider-name">Groq</div>
                    <div className="provider-desc">Llama 3, Mixtral, Gemma, Whisper</div>
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
                        <li>Single key checks</li>
                        <li>No account required</li>
                        <li>Basic model discovery</li>
                        <li>Browser-safe mode</li>
                    </ul>
                    <Link href="/app" className="btn">Test Now</Link>
                </div>
                
                <div className="pricing-card popular" data-hover="true">
                    <div className="popular-badge">Most Popular</div>
                    <div className="plan-name">DEV</div>
                    <div className="plan-price">$5<span style={{fontSize: "1rem", fontFamily: "var(--font-sans)"}}>/mo</span></div>
                    <ul className="plan-features">
                        <li>Save and monitor keys</li>
                        <li>Expiration alerts &amp; history</li>
                        <li>Full rate limit extraction</li>
                        <li>API access for CLI tracking</li>
                    </ul>
                    <Link href="/app" className="btn invert">Subscribe</Link>
                </div>
                
                <div className="pricing-card" data-hover="true">
                    <div className="plan-name">TEAM</div>
                    <div className="plan-price">$15<span style={{fontSize: "1rem", fontFamily: "var(--font-sans)"}}>/mo</span></div>
                    <ul className="plan-features">
                        <li>Unlimited key tracking</li>
                        <li>Team sharing &amp; roles</li>
                        <li>Advanced cost calculators</li>
                        <li>Priority email support</li>
                    </ul>
                    <a href="#contact" className="btn">Contact Us</a>
                </div>
            </div>
        </section>

        <section className="faq fade-up">
            <span className="section-label">FAQ</span>
            <h2 className="faq-title">Questions, answered.</h2>
            
            <div className="faq-list">
                <div className="faq-item">
                    <button className="faq-q" data-hover="true">
                        Is my API key safe?
                        <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-a">
                        <p>Yes. Keys are strictly processed in volatile runtime memory and immediately discarded after testing. We write absolutely nothing to persistent databases or server logs.</p>
                    </div>
                </div>
                <div className="faq-item">
                    <button className="faq-q" data-hover="true">
                        How does browser-safe mode work?
                        <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-a">
                                <p>For providers that support open CORS (like Gemini), we bypass our backend entirely. The network fetch happens straight from your client window directly to the provider&apos;s endpoint.</p>
                    </div>
                </div>
                <div className="faq-item">
                    <button className="faq-q" data-hover="true">
                        Which providers are supported?
                        <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-a">
                        <p>We currently natively decode universally recognized keys from OpenAI, Google Gemini, Anthropic, and Groq by examining their distinct prefix signatures.</p>
                    </div>
                </div>
                <div className="faq-item">
                    <button className="faq-q" data-hover="true">
                        Is the source code open?
                        <span className="faq-icon">+</span>
                    </button>
                    <div className="faq-a">
                        <p>The core capability discovery engine is fully open source. You can view, audit, or host the underlying tests yourself by visiting our GitHub repository.</p>
                    </div>
                </div>
                <div className="faq-item">
                    <button className="faq-q" data-hover="true">
                        Do you log or store anything?
                        <span className="faq-icon">+</span>
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
            <Link href="/app" className="btn invert" style={{marginTop: "var(--spacing-sm)"}} data-hover="true">Analyze Your Key Free &rarr;</Link>
        </section>

        <footer>
            <div className="footer-inner">
                <div>
                    <div className="footer-logo">APILens</div>
                    <div className="footer-tagline">By developers. For engineers.</div>
                </div>
                <div className="footer-links">
                    <a href="https://github.com/jaggureddy11/API-CAPABILITY-DISCOVERY" data-hover="true" target="_blank">GitHub</a>
                    <a href="#" data-hover="true">Docs</a>
                    <a href="#" data-hover="true">Privacy</a>
                    <a href="#" data-hover="true">Terms</a>
                </div>
            </div>
            <div className="footer-bottom">
                Built for developers. Trusted by engineers. &copy; 2026 APILens.
            </div>
        </footer>
    </div>

    
        </div>
    );
}
