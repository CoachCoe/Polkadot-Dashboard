'use client';

import { useEffect } from 'react';
import { getWallets } from '@talismn/connect-wallets';

export function WalletInitializer() {
  useEffect(() => {
    // Initialize wallets only on the client side
    if (typeof window !== 'undefined') {
      try {
        getWallets();
      } catch (error) {
        console.warn('Failed to initialize wallets:', error);
      }
    }
  }, []);

  return null;
} 