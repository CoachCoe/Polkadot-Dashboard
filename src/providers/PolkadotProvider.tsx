'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ProviderInterface } from '@polkadot/rpc-provider/types';
import { web3Enable } from '@polkadot/extension-dapp';

interface PolkadotContextType {
  api: ApiPromise | null;
  isConnected: boolean;
  error: string | null;
}

const PolkadotContext = createContext<PolkadotContextType>({
  api: null,
  isConnected: false,
  error: null,
});

export const usePolkadot = () => useContext(PolkadotContext);

interface PolkadotProviderProps {
  children: React.ReactNode;
}

export function PolkadotProvider({ children }: PolkadotProviderProps) {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPolkadot = async () => {
      try {
        // Initialize the API
        const wsProvider = new WsProvider('wss://rpc.polkadot.io');
        const provider = wsProvider as unknown as ProviderInterface;
        const api = await ApiPromise.create({ provider });
        setApi(api);

        // Enable the extension
        const extensions = await web3Enable('Polkadot Hub');
        if (extensions.length === 0) {
          setError('No extension found');
          return;
        }

        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to Polkadot network');
        setIsConnected(false);
      }
    };

    void initPolkadot();

    return () => {
      if (api) {
        void api.disconnect();
      }
    };
  }, []);

  return (
    <PolkadotContext.Provider value={{ api, isConnected, error }}>
      {children}
    </PolkadotContext.Provider>
  );
} 