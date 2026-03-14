import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark'|'light'>('light');

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t === 'dark') setTheme('dark');
    else setTheme('light');
  }, []);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Step 1: circular reveal overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '99999';
    overlay.style.pointerEvents = 'none';
    overlay.style.background = newTheme === 'dark' ? '#000000' : '#ffffff';
    overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;
    document.body.appendChild(overlay);

    const anim = overlay.animate(
      [
        { clipPath: `circle(0% at ${x}px ${y}px)` },
        { clipPath: `circle(150% at ${x}px ${y}px)` }
      ],
      {
        duration: 600,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      }
    );

    // Step 2: swap theme
    setTimeout(() => {
      if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('capmap-theme', newTheme);
      setTheme(newTheme);
    }, 300);

    // Step 3: reveal fades out
    anim.onfinish = () => {
      const fade = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        fill: 'forwards'
      });
      fade.onfinish = () => overlay.remove();
    };
  };

  return (
    <button
      suppressHydrationWarning
      onClick={toggleTheme}
      style={{
        background: 'none',
        border: 'none',
        fontFamily: 'Syne, sans-serif',
        fontSize: '10px',
        letterSpacing: '0.15em',
        cursor: 'pointer',
        color: 'var(--fg)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        outline: 'none',
        textTransform: 'uppercase'
      }}
    >
      <span>{theme === 'light' ? '○' : '●'}</span>
      <span>{theme === 'light' ? 'DARK' : 'WHITE'}</span>
    </button>
  );
}
