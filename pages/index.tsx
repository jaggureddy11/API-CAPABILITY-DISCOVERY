import Head from 'next/head';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>API Capability Discovery</title>
        <meta name="description" content="Discover the capabilities securely for your API keys." />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <Dashboard />
      </main>
    </>
  );
}
