'use client';

import React, { useEffect } from 'react';
import { polkadotService } from '@/services/polkadot';
import { portfolioService } from '@/services/portfolioService';

interface PolkadotProviderProps {
  children: React.ReactNode;
}

export function PolkadotProvider({ children }: PolkadotProviderProps) {
  useEffect(() => {
    async function initializePolkadotApi() {
      try {
        const api = await polkadotService.connect();
        await portfolioService.init(api);
      } catch (error) {
        console.error('Failed to initialize Polkadot API:', error);
      }
    }

    void initializePolkadotApi();

    // Cleanup on unmount
    return () => {
      void polkadotService.disconnect();
    };
  }, []);

  return <>{children}</>;
} 