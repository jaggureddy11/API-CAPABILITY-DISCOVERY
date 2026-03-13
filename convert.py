import re
import os

with open('/Users/apple/Desktop/apii/apilens.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract CSS
css_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
css = css_match.group(1) if css_match else ''

# Scope to .landing-theme
css = css.replace('body {', '.landing-theme {')
css = css.replace('::selection', '.landing-theme ::selection')
css = css.replace('::-moz-selection', '.landing-theme ::-moz-selection')
css = css.replace('clamp(3rem, 8vw, 7rem)', 'clamp(4rem, 12vw, 11rem)')

# Extract Body
body_match = re.search(r'<body>(.*?)<script>', html, re.DOTALL)
body_content = body_match.group(1) if body_match else ''
body_content = body_content.replace('class=', 'className=')
body_content = body_content.replace('for=', 'htmlFor=')
body_content = body_content.replace('style="margin-top: var(--spacing-sm)"', 'style={{marginTop: "var(--spacing-sm)"}}')
body_content = body_content.replace('style="padding: 0.6rem 1.2rem; font-size: 0.65rem;"', 'style={{padding: "0.6rem 1.2rem", fontSize: "0.65rem"}}')
body_content = body_content.replace('style="font-size: 1rem; font-family: var(--font-sans)"', 'style={{fontSize: "1rem", fontFamily: "var(--font-sans)"}}')
body_content = body_content.replace('<br>', '<br />')
body_content = body_content.replace('data-hover', 'data-hover="true"')
body_content = body_content.replace('href="#', 'href="#')
body_content = body_content.replace('href="#"', 'href="#"')

# The CLI block has curly braces if I use `{` in React string literals, but I am putting the HTML directly as JSX.
# In React JSX, bare `{' and `}` need escaping if they are standalone, but the only issue earlier was Python's f-string parsing `{`.
# HTML doesn't natively contain { } except in my JS, but I stripped the JS. So body_content has no `{}` except what I added.
# Wait, my CLI text doesn't contain braces anyway: ┌─────────────────────────────────────┐ it's all box drawing!
# Ah, I replaced the CLI block myself with `{` in the PREVIOUS broken script.

# Fix the links to route correctly
body_content = body_content.replace('href="#analyze"', 'href="/app"')
body_content = body_content.replace('href="#test"', 'href="/app"')
body_content = body_content.replace('href="#subscribe"', 'href="/app"')

# Build Next.js React component
react_code = """import React, { useEffect, useRef, useState } from 'react';
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
        
        const moveCursor = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };

        document.addEventListener('mousemove', moveCursor);

        const handleMouseEnter = () => cursor.classList.add('hovering');
        const handleMouseLeave = () => cursor.classList.remove('hovering');

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });

        // Intersection Observer
        const fadeElements = document.querySelectorAll('.fade-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        fadeElements.forEach(el => observer.observe(el));

        // Navbar Scroll
        let lastScroll = 0;
        const handleScroll = () => {
            const currentScroll = window.pageYOffset;
            const navbar = navRef.current;
            if (navbar) {
                if (currentScroll > lastScroll && currentScroll > 100) {
                    navbar.classList.add('hidden');
                } else {
                    navbar.classList.remove('hidden');
                }
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
        let timeoutId: any;
        
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
                    timeoutId = setTimeout(typeWriter, 40);
                } else {
                    lineIdx++;
                    charIdx = 0;
                    timeoutId = setTimeout(typeWriter, 500);
                }
            }
        };
        
        timeoutId = setTimeout(typeWriter, 1000);

        return () => {
            document.removeEventListener('mousemove', moveCursor);
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
                    if(a) a.style.height = '0px';
                });

                // open if wasn't active
                if (!isActive) {
                    item.classList.add('active');
                    answer.style.height = answer.scrollHeight + 'px';
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
            <style dangerouslySetInnerHTML={{ __html: `""" + css + """` }} />
""" + body_content + """
        </div>
    );
}
"""

with open('/Users/apple/Desktop/apii/capability-discovery/pages/index.tsx', 'w', encoding='utf-8') as f:
    f.write(react_code)
