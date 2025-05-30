'use client';

import React, { Suspense } from 'react';
import { Providers } from '@/app/providers';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/layout/Footer';
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
          <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
            <Footer />
            </div>
        </Providers>
      </AnalyticsWrapper>
    </Suspense>
  );
} 