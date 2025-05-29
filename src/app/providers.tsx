'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { SessionProvider } from 'next-auth/react';

const PolkadotProvider = dynamic(
  () => import('@/providers/PolkadotProvider').then(mod => ({ default: mod.PolkadotProvider })),
  { ssr: false }
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PolkadotProvider>
            {children}
          </PolkadotProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SessionProvider>
  );
} 