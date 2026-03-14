# CapMap — AI Capability Discovery Engine

**By developers. For engineers.**
A state-of-the-art, secure, and stateless developer tool designed to meticulously inspect AI API keys and map their underlying capabilities—without ever storing or compromising your keys.

![CapMap Dashboard](https://github.com/jaggureddy11/API-CAPABILITY-DISCOVERY/raw/main/public/og-image.png)

## 🌐 Live Site
Visit [CapMap.io](https://capmap.io) (or your deployment URL) to map your keys.

## ✨ Core Pillars

- **🛡️ Security First:** Stateless design. Keys are processed exclusively in-memory or client-side and discarded instantly. Your keys never touch a database.
- **🗺️ Multi-Provider Support:** Comprehensive mapping for **OpenAI, Anthropic, Google Gemini, Groq, and Perplexity**.
- **🧠 Intelligence Layer:** Automatically generated AI analysis of your key's potential, providing use-case recommendations and architectural insights.
- **🎨 Premium Aesthetics:** A bespoke design system built with custom CSS, featuring glassmorphism, smooth animations, and a focus on visual excellence.
- **⚡ Instant Validation:** Direct model-lineage inspection, capability detection (Vision, Function Calling, Embeddings), and rate-limit estimates.

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** Custom Vanilla CSS (Design Tokens, Glassmorphism, Premium Typography)
- **AI Integration:** Direct Provider API Integrations + CapMap Intelligence Engine
- **Icons:** Custom SVG + Lucide React
- **Typography:** Syne, Inter, Libre Baskerville (Google Fonts)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm / pnpm / yarn

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/jaggureddy11/API-CAPABILITY-DISCOVERY.git
   cd capability-discovery
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional for Local AI Features):**
   ```bash
   cp .env.example .env.local
   # Add your GEMINI_API_KEY for the internal AI advisor features
   ```

4. **Launch Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the App:** 
   Open [http://localhost:3000](http://localhost:3000)

## 📂 Project Architecture

- **`/pages`**: Next.js Router (Landing page, App views, and API proxy endpoints)
- **`/components`**: Reusable UI blocks (`Dashboard`, `CostEstimator`, `ThemeToggle`, `AILoading`)
- **`/lib/capabilityEngine`**: The core facade that normalizes multi-provider discovery logic.
- **`/lib/providers`**: Specialized adapter logic for each AI ecosystem (Anthropic, Gemini, Groq, etc.).
- **`/styles`**: Custom global design system and variable tokens.

## 📜 Deployment

Deploy seamlessly on **Vercel** or any Node-ready infrastructure.

```bash
vercel --prod
```

---
Built with passion for the developer community. Map your potential.
