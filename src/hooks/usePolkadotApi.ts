import { useState, useEffect } from 'react';
import { ApiPromise } from '@polkadot/api';
import { polkadotService } from '@/services/polkadot';

interface PolkadotApiState {
  api: ApiPromise | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | null;
}

export function usePolkadotApi() {
  const [state, setState] = useState<PolkadotApiState>({
    api: null,
    isConnecting: true,
    isConnected: false,
    error: null
  });

  useEffect(() => {
    let isSubscribed = true;

    async function initConnection() {
      if (!isSubscribed) return;

      try {
        setState(prev => ({ ...prev, isConnecting: true, error: null }));
        
        const api = await polkadotService.connect();

        if (!isSubscribed) return;

        setState({
          api,
          isConnecting: false,
          isConnected: true,
          error: null
        });

        // Handle disconnection
        api.on('disconnected', () => {
          if (!isSubscribed) return;
          console.warn('API disconnected. Attempting to reconnect...');
          setState(prev => ({
            ...prev,
            isConnected: false,
            error: new Error('Connection lost')
          }));
        });

        // Handle error
        api.on('error', (error: Error) => {
          if (!isSubscribed) return;
          console.error('API connection error:', error);
          setState(prev => ({
            ...prev,
            isConnected: false,
            error
          }));
        });

      } catch (error) {
        if (!isSubscribed) return;
        console.error('Failed to connect to Polkadot API:', error);
        setState({
          api: null,
          isConnecting: false,
          isConnected: false,
          error: error as Error
        });
      }
    }

    initConnection();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return state;
} 