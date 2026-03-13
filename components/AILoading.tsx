import { useState, useEffect } from 'react';

export default function AILoading({ label = "analyzing" }: { label?: string }) {
  const [dots, setDots] = useState(1);
  const [showColdStart, setShowColdStart] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setDots(d => d === 3 ? 1 : d + 1), 400);
    const coldStartTimer = setTimeout(() => setShowColdStart(true), 3000);
    return () => {
        clearInterval(t);
        clearTimeout(coldStartTimer);
    };
  }, []);

  if (showColdStart) {
      return (
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "14px", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
              Loading AI model, first run may take 30 seconds...
          </span>
      );
  }

  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "11px",
      color: "rgba(255,255,255,0.3)"
    }}>
      {label}{"·".repeat(dots)}
    </span>
  );
}
