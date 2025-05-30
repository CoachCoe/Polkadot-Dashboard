'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ProviderInterface } from '@polkadot/rpc-provider/types';
import { web3Enable } from '@polkadot/extension-dapp';
import { useWalletStore } from '@/store/useWalletStore';

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
  const { selectedAccount } = useWalletStore();
  const isWalletConnected = !!selectedAccount;

  useEffect(() => {
    let isSubscribed = true;
    let currentApi: ApiPromise | null = null;

    const initPolkadot = async () => {
      try {
        // If we already have a connected API and the wallet is still connected, don't reinitialize
        if (currentApi?.isConnected && isWalletConnected) {
          return;
        }

        // If wallet is disconnected, cleanup the API
        if (!isWalletConnected) {
          if (currentApi) {
            await currentApi.disconnect();
            if (isSubscribed) {
              setApi(null);
              setIsConnected(false);
            }
          }
          return;
        }

        // Initialize the API if we don't have one
        if (!currentApi || !currentApi.isConnected) {
        const wsProvider = new WsProvider('wss://rpc.polkadot.io');
        const provider = wsProvider as unknown as ProviderInterface;
          const newApi = await ApiPromise.create({ provider });
          currentApi = newApi;

        // Enable the extension
        const extensions = await web3Enable('Polkadot Hub');
        if (extensions.length === 0) {
            throw new Error('No extension found');
          }

          // Subscribe to connection state changes
          newApi.on('connected', () => {
            if (isSubscribed) {
              setIsConnected(true);
              setError(null);
            }
          });

          newApi.on('disconnected', () => {
            if (isSubscribed) {
              setIsConnected(false);
        }
          });

          if (isSubscribed) {
            setApi(newApi);
        setIsConnected(true);
        setError(null);
          }
        }
      } catch (err) {
        if (isSubscribed) {
        setError(err instanceof Error ? err.message : 'Failed to connect to Polkadot network');
        setIsConnected(false);
        }
      }
    };

    void initPolkadot();

    return () => {
      isSubscribed = false;
      // Don't disconnect the API on cleanup
      // Only disconnect when the wallet is explicitly disconnected
    };
  }, [selectedAccount, isWalletConnected]);

  return (
    <PolkadotContext.Provider value={{ api, isConnected, error }}>
      {children}
    </PolkadotContext.Provider>
  );
} 