'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { polkadotService } from '@/services/polkadot';
import { portfolioService } from '@/services/portfolioService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PolkadotProviderProps {
  children: React.ReactNode;
}

export function PolkadotProvider({ children }: PolkadotProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const isConnectingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000;

  const initializePolkadotApi = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || cleanupInProgressRef.current) {
      return;
    }

    try {
      isConnectingRef.current = true;
      setError(null);
      
      const api = await polkadotService.connect();
      
      // Set up reconnection handler
      api.on('disconnected', async () => {
        console.warn('API disconnected. Attempting to reconnect...');
        if (cleanupInProgressRef.current) return;
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          // Clear the connecting flag before attempting reconnection
          isConnectingRef.current = false;
          setTimeout(() => {
            void initializePolkadotApi();
          }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          setError(new Error('Failed to maintain connection after multiple attempts'));
        }
      });

      api.on('connected', () => {
        if (cleanupInProgressRef.current) return;
        setRetryCount(0); // Reset retry count on successful connection
        setIsInitialized(true);
        isConnectingRef.current = false;
      });

      api.on('error', (err: Error) => {
        if (cleanupInProgressRef.current) return;
        console.error('API error:', err);
        setError(err);
        isConnectingRef.current = false;
      });

      await portfolioService.init(api);
      if (!cleanupInProgressRef.current) {
        setIsInitialized(true);
        isConnectingRef.current = false;
      }
    } catch (error) {
      if (cleanupInProgressRef.current) return;
      
      console.error('Failed to initialize Polkadot API:', error);
      setError(error instanceof Error ? error : new Error('Failed to initialize Polkadot API'));
      
      // Attempt to retry connection
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          isConnectingRef.current = false;
          void initializePolkadotApi();
        }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      }
      isConnectingRef.current = false;
    }
  }, [retryCount]);

  useEffect(() => {
    // Only initialize if we're in the browser
    if (typeof window === 'undefined') {
      return;
    }

    void initializePolkadotApi();

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        try {
          cleanupInProgressRef.current = true;
          await polkadotService.disconnect();
        } catch (error) {
          console.error('Error during cleanup:', error);
        } finally {
          cleanupInProgressRef.current = false;
        }
      };
      void cleanup();
    };
  }, [initializePolkadotApi]);

  // Don't show loading state during SSR
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  if (!isInitialized && !error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 text-pink-500 mb-4" />
          <p className="text-gray-600">
            {retryCount > 0 ? `Reconnecting to Polkadot network (Attempt ${retryCount}/${MAX_RETRIES})...` : 'Connecting to Polkadot network...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-xl mb-4">Connection Error</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => {
              setRetryCount(0);
              isConnectingRef.current = false;
              void initializePolkadotApi();
            }}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 