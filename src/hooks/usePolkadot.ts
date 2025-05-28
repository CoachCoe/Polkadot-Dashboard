'use client';
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { InjectedAccount } from '@polkadot/extension-inject/types';
import { web3Enable } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';

interface UsePolkadotReturn {
  isConnected: boolean;
  isWalletConnected: boolean;
  accounts: InjectedAccount[];
  selectedAccount: InjectedAccount | null;
  api: ApiPromise | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function usePolkadot(): UsePolkadotReturn {
  const { selectedAccount, setSelectedAccount, loadAccounts, accounts } = useWalletStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [api, setApi] = useState<ApiPromise | null>(null);

  useEffect(() => {
    const initApi = async () => {
      try {
        const provider = new WsProvider(process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://rpc.polkadot.io');
        const api = await ApiPromise.create({ provider });
        setApi(api);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to Polkadot node:', error);
        setIsConnected(false);
      }
    };

    void initApi();

    return () => {
      if (api) {
        void api.disconnect();
      }
    };
  }, []);

  const connect = async () => {
    try {
      await web3Enable('Polkadot Dashboard');
      await loadAccounts();
      setIsWalletConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsWalletConnected(false);
      throw error;
    }
  };

  const disconnect = () => {
    setSelectedAccount(null);
    setIsWalletConnected(false);
  };

  return {
    isConnected,
    isWalletConnected,
    accounts,
    selectedAccount,
    api,
    connect,
    disconnect,
  };
} 