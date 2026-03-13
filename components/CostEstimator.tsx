import { useState, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PRICING DATA — Updated March 2026 from official provider docs
// Sources:
//   OpenAI    → openai.com/api/pricing
//   Anthropic → platform.claude.com/docs/en/about-claude/pricing
//   Google    → ai.google.dev/gemini-api/docs/pricing
//   Groq      → groq.com/pricing
// All prices in USD per 1M tokens
// ─────────────────────────────────────────────────────────────────────────────

interface ModelInfo {
  input: number;
  output: number;
  context: string;
  provider: "openai" | "anthropic" | "google" | "groq";
  tier: "flagship" | "balanced" | "budget";
  notes?: string;
}

const MODEL_PRICING: Record<string, ModelInfo> = {
  // ── OpenAI ── openai.com/api/pricing (March 2026)
  "gpt-5":             { input: 1.25,  output: 10.00, context: "400k",  provider: "openai",    tier: "flagship" },
  "gpt-5-mini":        { input: 0.25,  output: 2.00,  context: "400k",  provider: "openai",    tier: "balanced" },
  "gpt-5-nano":        { input: 0.05,  output: 0.40,  context: "128k",  provider: "openai",    tier: "budget"   },
  "gpt-4o":            { input: 2.50,  output: 10.00, context: "128k",  provider: "openai",    tier: "balanced", notes: "Previous gen flagship" },
  "gpt-4o-mini":       { input: 0.15,  output: 0.60,  context: "128k",  provider: "openai",    tier: "budget"   },
  "gpt-4.1":           { input: 2.00,  output: 8.00,  context: "1M",    provider: "openai",    tier: "balanced", notes: "1M context window" },
  "gpt-4.1-mini":      { input: 0.40,  output: 1.60,  context: "1M",    provider: "openai",    tier: "budget"   },
  "gpt-4.1-nano":      { input: 0.10,  output: 0.40,  context: "1M",    provider: "openai",    tier: "budget"   },
  "o3":                { input: 2.00,  output: 8.00,  context: "200k",  provider: "openai",    tier: "flagship", notes: "Reasoning model" },
  "o4-mini":           { input: 1.10,  output: 4.40,  context: "200k",  provider: "openai",    tier: "balanced", notes: "Reasoning model" },

  // ── Anthropic ── platform.claude.com/docs (March 2026)
  "claude-opus-4.6":   { input: 5.00,  output: 25.00, context: "200k",  provider: "anthropic", tier: "flagship" },
  "claude-sonnet-4.6": { input: 3.00,  output: 15.00, context: "200k",  provider: "anthropic", tier: "balanced", notes: "Default model, near-Opus quality" },
  "claude-sonnet-4.5": { input: 3.00,  output: 15.00, context: "200k",  provider: "anthropic", tier: "balanced" },
  "claude-haiku-4.5":  { input: 1.00,  output: 5.00,  context: "200k",  provider: "anthropic", tier: "balanced" },
  "claude-haiku-3.5":  { input: 0.80,  output: 4.00,  context: "200k",  provider: "anthropic", tier: "budget"   },
  "claude-haiku-3":    { input: 0.25,  output: 1.25,  context: "200k",  provider: "anthropic", tier: "budget",   notes: "Fastest & cheapest" },

  // ── Google Gemini ── ai.google.dev/gemini-api/docs/pricing (March 2026)
  "gemini-3-pro":           { input: 2.00,  output: 12.00, context: "2M",  provider: "google", tier: "flagship", notes: "Preview — pricing may change" },
  "gemini-3-flash":         { input: 0.50,  output: 3.00,  context: "1M",  provider: "google", tier: "balanced", notes: "Preview" },
  "gemini-2.5-pro":         { input: 1.25,  output: 10.00, context: "1M",  provider: "google", tier: "flagship", notes: ">200k tokens: $2.50/$15.00" },
  "gemini-2.5-flash":       { input: 0.30,  output: 2.50,  context: "1M",  provider: "google", tier: "balanced" },
  "gemini-2.5-flash-lite":  { input: 0.10,  output: 0.40,  context: "1M",  provider: "google", tier: "budget"   },

  // ── Groq ── groq.com/pricing (March 2026)
  "llama-4-maverick":  { input: 0.50,  output: 0.77,  context: "128k",  provider: "groq",      tier: "balanced", notes: "LPU ultra-fast inference" },
  "llama-4-scout":     { input: 0.11,  output: 0.34,  context: "128k",  provider: "groq",      tier: "budget"   },
  "llama-3.3-70b":     { input: 0.59,  output: 0.79,  context: "128k",  provider: "groq",      tier: "balanced" },
  "llama-3.1-8b":      { input: 0.05,  output: 0.08,  context: "128k",  provider: "groq",      tier: "budget"   },
  "deepseek-r1-groq":  { input: 0.75,  output: 0.99,  context: "128k",  provider: "groq",      tier: "balanced", notes: "Reasoning model" },
  "mixtral-8x7b":      { input: 0.24,  output: 0.24,  context: "32k",   provider: "groq",      tier: "budget"   },
  "gemma2-9b":         { input: 0.20,  output: 0.20,  context: "8k",    provider: "groq",      tier: "budget"   },
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI", anthropic: "Anthropic", google: "Google", groq: "Groq",
};

interface CostEstimatorProps {
  availableModels?: string[];
}

function fmt(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1)    return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

export default function CostEstimator({ availableModels }: CostEstimatorProps) {
  const modelList = useMemo(() => {
    if (availableModels && availableModels.length > 0) {
      return availableModels.filter((m) => MODEL_PRICING[m]);
    }
    return Object.keys(MODEL_PRICING);
  }, [availableModels]);

  const [selectedModel, setSelectedModel] = useState(modelList[0] ?? "gpt-4o");
  const [callsPerDay,   setCallsPerDay]   = useState(1000);
  const [inputTokens,   setInputTokens]   = useState(300);
  const [outputTokens,  setOutputTokens]  = useState(200);
  const [expanded,      setExpanded]      = useState(false);
  const [flash,         setFlash]         = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlash(false);
    const t = setTimeout(() => setFlash(true), 60);
    return () => clearTimeout(t);
  }, [selectedModel, callsPerDay, inputTokens, outputTokens]);

  const pricing = MODEL_PRICING[selectedModel];

  const perCall  = pricing
    ? (inputTokens  / 1_000_000) * pricing.input
    + (outputTokens / 1_000_000) * pricing.output
    : 0;

  const daily   = perCall * callsPerDay;
  const monthly = daily * 30;
  const yearly  = daily * 365;

  const cheaperModel = modelList.find(
    (m) => MODEL_PRICING[m]?.provider === pricing?.provider
        && MODEL_PRICING[m]?.input < (pricing?.input ?? 0)
  );
  const tip =
    monthly > 500 && cheaperModel
      ? `At this scale, switching to ${cheaperModel} saves ~${Math.round((1 - MODEL_PRICING[cheaperModel].input / (pricing?.input ?? 1)) * 100)}% on input costs.`
      : monthly < 0.50
      ? "Very low cost — you can scale 100× before reaching $15/month."
      : null;

  const grouped = useMemo(() => {
    const g: Record<string, string[]> = {};
    modelList.forEach((m) => {
      const p = MODEL_PRICING[m]?.provider ?? "other";
      if (!g[p]) g[p] = [];
      g[p].push(m);
    });
    return g;
  }, [modelList]);

  const inputPct  = Math.round((inputTokens  / (inputTokens + outputTokens)) * 100);
  const outputPct = 100 - inputPct;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Syne:wght@400;700&family=Inter:wght@300;400&family=JetBrains+Mono:wght@400;500&display=swap');
        .ce{font-family:'Inter',sans-serif;background:#000;color:#fff;border:1px solid rgba(255,255,255,0.15);margin-top:2px}
        .ce-hdr{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.08);cursor:pointer;user-select:none}
        .ce-hdr:hover{background:rgba(255,255,255,0.03)}
        .ce-ttl{font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.2em;color:rgba(255,255,255,0.45)}
        .ce-tgl{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.3)}
        .ce-hdr:hover .ce-tgl{color:rgba(255,255,255,0.65)}
        .ce-body{overflow:hidden;max-height:0;transition:max-height .4s cubic-bezier(.4,0,.2,1)}
        .ce-body.open{max-height:900px}
        .ce-inner{padding:18px}
        .ce-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
        .ce-badge{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.1);padding:3px 8px}
        .ce-badge.hi{color:rgba(255,255,255,0.7);border-color:rgba(255,255,255,0.35)}
        .ce-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
        .ce-fld{display:flex;flex-direction:column;gap:4px}
        .ce-fld-full{grid-column:1/-1}
        .ce-lbl{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:0.16em;color:rgba(255,255,255,0.35)}
        .ce-sel,.ce-inp{background:#000;border:1px solid rgba(255,255,255,0.18);color:#fff;font-family:'JetBrains Mono',monospace;font-size:12px;padding:8px 10px;outline:none;width:100%;box-sizing:border-box;-webkit-appearance:none;appearance:none;border-radius:0;transition:border-color .15s}
        .ce-sel:focus,.ce-inp:focus{border-color:rgba(255,255,255,0.55)}
        .ce-sel option,.ce-sel optgroup{background:#111;font-family:'JetBrains Mono',monospace}
        .ce-sel-wrap{position:relative}
        .ce-sel-wrap::after{content:'▾';position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:9px;color:rgba(255,255,255,0.35);pointer-events:none}
        .ce-notes{font-family:'Inter',sans-serif;font-size:10px;font-weight:300;color:rgba(255,255,255,0.28);margin-top:4px;font-style:italic}
        .ce-bar-wrap{margin-bottom:14px}
        .ce-bar{height:1px;background:rgba(255,255,255,0.08);margin-bottom:5px}
        .ce-bar-fill{height:100%;background:#fff;transition:width .35s ease}
        .ce-bar-labels{display:flex;justify-content:space-between}
        .ce-bar-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.28)}
        .ce-div{border:none;border-top:1px solid rgba(255,255,255,0.07);margin:14px 0}
        .ce-row{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
        .ce-row:last-child{border-bottom:none}
        .ce-row-lbl{font-family:'Syne',sans-serif;font-size:8px;font-weight:700;letter-spacing:0.16em;color:rgba(255,255,255,0.32)}
        .ce-row-val{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#fff;transition:opacity .12s}
        .ce-row-val.dim{opacity:0.25}
        .ce-row.hl .ce-row-lbl{color:rgba(255,255,255,0.55)}
        .ce-row.hl .ce-row-val{font-size:22px}
        .ce-tip{margin-top:12px;padding:9px 12px;border:1px solid rgba(255,255,255,0.08);font-family:'Inter',sans-serif;font-size:10px;font-weight:300;color:rgba(255,255,255,0.4);line-height:1.6}
        .ce-src{margin-top:10px;font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(255,255,255,0.18);letter-spacing:0.05em}
        @media(max-width:480px){.ce-grid{grid-template-columns:1fr}.ce-fld-full{grid-column:1}}
      `}</style>

      <div className="ce">
        <div className="ce-hdr" onClick={() => setExpanded(v => !v)}>
          <span className="ce-ttl">COST ESTIMATOR</span>
          <span className="ce-tgl">{expanded ? "[ − COLLAPSE ]" : "[ + EXPAND ]"}</span>
        </div>

        <div className={`ce-body${expanded ? " open" : ""}`}>
          <div className="ce-inner">

            {pricing && (
              <div className="ce-badges">
                <span className="ce-badge hi">{PROVIDER_LABELS[pricing.provider]}</span>
                <span className="ce-badge hi">{pricing.tier.toUpperCase()}</span>
                <span className="ce-badge">CTX {pricing.context}</span>
                <span className="ce-badge">IN \${pricing.input}/1M</span>
                <span className="ce-badge">OUT \${pricing.output}/1M</span>
              </div>
            )}

            <div className="ce-grid">
              <div className="ce-fld ce-fld-full">
                <label className="ce-lbl">MODEL</label>
                <div className="ce-sel-wrap">
                  <select className="ce-sel" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                    {Object.entries(grouped).map(([provider, models]) => (
                      <optgroup key={provider} label={`── ${PROVIDER_LABELS[provider] ?? provider} ──`}>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {pricing?.notes && <div className="ce-notes">↳ {pricing.notes}</div>}
              </div>

              <div className="ce-fld">
                <label className="ce-lbl">CALLS / DAY</label>
                <input className="ce-inp" type="number" min={1} value={callsPerDay}
                  onChange={e => setCallsPerDay(Math.max(1, Number(e.target.value)))} />
              </div>

              <div className="ce-fld">
                <label className="ce-lbl">AVG INPUT TOKENS</label>
                <input className="ce-inp" type="number" min={1} value={inputTokens}
                  onChange={e => setInputTokens(Math.max(1, Number(e.target.value)))} />
              </div>

              <div className="ce-fld">
                <label className="ce-lbl">AVG OUTPUT TOKENS</label>
                <input className="ce-inp" type="number" min={1} value={outputTokens}
                  onChange={e => setOutputTokens(Math.max(1, Number(e.target.value)))} />
              </div>
            </div>

            <div className="ce-bar-wrap">
              <div className="ce-bar">
                <div className="ce-bar-fill" style={{ width: `${inputPct}%` }} />
              </div>
              <div className="ce-bar-labels">
                <span className="ce-bar-lbl">INPUT {inputPct}%</span>
                <span className="ce-bar-lbl">OUTPUT {outputPct}%</span>
              </div>
            </div>

            <hr className="ce-div" />

            {[
              { label: "PER CALL", val: fmt(perCall),  hl: false },
              { label: "DAILY",    val: fmt(daily),    hl: false },
              { label: "MONTHLY",  val: fmt(monthly),  hl: true  },
              { label: "YEARLY",   val: fmt(yearly),   hl: false },
            ].map(({ label, val, hl }) => (
              <div key={label} className={`ce-row${hl ? " hl" : ""}`}>
                <span className="ce-row-lbl">{label}</span>
                <span className={`ce-row-val${flash ? "" : " dim"}`}>{val}</span>
              </div>
            ))}

            {tip && <div className="ce-tip">↳ {tip}</div>}

            <div className="ce-src">
              PRICING — OpenAI · Anthropic · Google AI · Groq — MARCH 2026
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
