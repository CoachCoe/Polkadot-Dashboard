'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <img
          className="dark:invert h-[37px] w-[180px]"
          src="/next.svg"
          alt="Next.js logo"
        />
        <div className="flex flex-col gap-6 items-center sm:items-start">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome to Polkadot Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-[600px] text-center sm:text-left">
            Your gateway to the Polkadot ecosystem. Connect your wallet to start exploring.
          </p>
          <div className="flex gap-4">
            <Link
              href="/ecosystem"
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Explore Ecosystem
            </Link>
            <Link
              href="/governance"
              className="bg-white text-pink-600 border border-pink-600 px-6 py-3 rounded-lg hover:bg-pink-50 transition-colors"
            >
              View Governance
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 