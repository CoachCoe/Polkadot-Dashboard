'use client';
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { WalletAccount } from '@talismn/connect-wallets';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';

interface UsePolkadotReturn {
  isConnected: boolean;
  isWalletConnected: boolean;
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  api: ApiPromise | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function usePolkadot(): UsePolkadotReturn {
  const { selectedAccount, connect, disconnect, accounts } = useWalletStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 5000;

  const initApi = async () => {
    try {
      const provider = new WsProvider(process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://rpc.polkadot.io');
      const newApi = await ApiPromise.create({ provider });
      
      // Set up event handlers
      provider.on('disconnected', () => {
        console.warn('API disconnected. Attempting to reconnect...');
        setIsConnected(false);
        handleReconnect();
      });

      provider.on('error', async (error) => {
        console.error('API error:', error);
        await securityLogger.logEvent({
          type: SecurityEventType.API_ERROR,
          timestamp: new Date().toISOString(),
          details: { error: error.message }
        });
        setIsConnected(false);
        handleReconnect();
      });

      await newApi.isReady;
      setApi(newApi);
      setIsConnected(true);
      setReconnectAttempts(0);
    } catch (error) {
      console.error('Failed to connect to Polkadot node:', error);
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      setIsConnected(false);
      handleReconnect();
    }
  };

  const handleReconnect = () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      void initApi();
    }, RECONNECT_DELAY);
  };

  useEffect(() => {
    void initApi();

    return () => {
      if (api) {
        void api.disconnect();
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      await connect();
      setIsWalletConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Failed to connect wallet' }
      });
      setIsWalletConnected(false);
      throw error;
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsWalletConnected(false);
  };

  return {
    isConnected,
    isWalletConnected,
    accounts,
    selectedAccount,
    api,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
} 