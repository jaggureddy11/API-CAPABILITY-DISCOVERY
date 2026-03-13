# API Capability Discovery

A secure, stateless Next.js developer tool designed to securely inspect an AI API key and discover the underlying capabilities (Models available, text generation, image generation, etc.) without logging or storing the keys.

## Features

- **Secure & Stateless:** Keys are processed exclusively in-memory and discarded instantly.
- **Provider Support:** Current primary support for Google Gemini API, extensible to OpenAI and Anthropic.
- **Browser-Safe Mode:** Discover capabilities purely client-side without reaching the `/api` backend.
- **Instant Capability Mapping:** Decodes limits, available generation methods (text, embeddings, images).
- **Responsive Dashboard:** Made with Tailwind CSS for an elegant UI.

## Tech Stack

- **Frontend:** React, Next.js (pages router for legacy support), Tailwind CSS 4.0
- **Backend:** Next.js `/api` endpoints
- **Styling Icons:** Lucide-React

## Getting Started

1. **Install Dependencies:** Check that you have node installed.
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```

3. **Open the browser:** Open [http://localhost:3000](http://localhost:3000).

## Project Structure

- `/components`: Contains `Dashboard.tsx`
- `/pages`: Contains Next.js views and `api/discover.ts`
- `/lib/capabilityEngine`: The discovery Facade mapping providers.
- `/lib/providers`: The specific mapping logic for `gemini`, `openai`, etc.
- `/types`: Contains standard TypeScript Interfaces `.ts`

## Deployment

Deploy this project on Vercel seamlessly by connecting your GitHub repository. Since the API keys are provided via the UI by the end user, no back-end environment variables are required!

```bash
vercel --prod
```
