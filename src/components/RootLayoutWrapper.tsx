'use client';

import React, { Suspense } from 'react';
import { Providers } from '@/app/providers';
import { Navbar } from '@/components/navigation/Navbar';
import { AnalyticsWrapper } from '@/utils/analytics';
import { WalletInitializer } from './WalletInitializer';
import { LoadingSpinner } from './common/LoadingSpinner';

export function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    }>
      <WalletInitializer />
      <AnalyticsWrapper>
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Polkadot Dashboard. Built with ♥ for the Polkadot community.
              </div>
            </div>
          </footer>
        </Providers>
      </AnalyticsWrapper>
    </Suspense>
  );
} 