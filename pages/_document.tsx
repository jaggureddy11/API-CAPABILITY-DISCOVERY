import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>CapMap — Map Every Capability Your API Key Unlocks</title>
        <meta name="description" content="CapMap analyzes your API key and instantly reveals every model, capability, and permission it unlocks. Free, secure, and open source." />
        <meta property="og:title" content="CapMap" />
        <meta property="og:description" content="Map every capability your API key unlocks. Instantly." />
        <meta name="application-name" content="CapMap" />
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=JetBrains+Mono&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400;500;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          const t = localStorage.getItem('capmap-theme') || localStorage.getItem('apilens-theme');
          if (t === 'dark') document.documentElement.setAttribute('data-theme','dark');
          else if (t === 'light') document.documentElement.removeAttribute('data-theme');
        `}} />
      </Head>
      <body className="antialiased" style={{ background: 'var(--bg)' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
