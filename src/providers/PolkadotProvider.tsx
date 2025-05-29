'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { polkadotService } from '@/services/polkadot';
import { portfolioService } from '@/services/portfolioService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PolkadotProviderProps {
  children: React.ReactNode;
}

export function PolkadotProvider({ children }: PolkadotProviderProps) {
  const [isInitialized, setIsInitialized] = useState(true); // Start as true to avoid unnecessary loading state
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const isConnectingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000;
  const CONNECTION_TIMEOUT = 30000; // 30 seconds timeout to match service

  const initializePolkadotApi = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || cleanupInProgressRef.current) {
      return;
    }

    try {
      isConnectingRef.current = true;
      setError(null);
      
      // Set a timeout for the entire connection process
      const timeoutId = setTimeout(() => {
        if (isConnectingRef.current) {
          isConnectingRef.current = false;
          setError(new Error('Connection timed out. Please check your internet connection and try again.'));
          setIsInitialized(true); // Allow rendering the app even if connection failed
        }
      }, CONNECTION_TIMEOUT);
      
      const api = await polkadotService.connect();
      
      clearTimeout(timeoutId);
      
      // Set up reconnection handler
      api.on('disconnected', async () => {
        console.warn('API disconnected. Attempting to reconnect...');
        if (cleanupInProgressRef.current) return;
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          isConnectingRef.current = false;
          setTimeout(() => {
            void initializePolkadotApi();
          }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          setError(new Error('Failed to maintain connection after multiple attempts'));
          setIsInitialized(true); // Allow rendering the app even if connection failed
        }
      });

      api.on('connected', () => {
        if (cleanupInProgressRef.current) return;
        setRetryCount(0);
        setIsInitialized(true);
        isConnectingRef.current = false;
      });

      api.on('error', (err: Error) => {
        if (cleanupInProgressRef.current) return;
        console.error('API error:', err);
        setError(err);
        isConnectingRef.current = false;
        setIsInitialized(true); // Allow rendering the app even if there's an error
      });

      try {
        await portfolioService.init(api);
      } catch (error) {
        console.warn('Portfolio service initialization failed:', error);
        // Don't block the app for portfolio service errors
      }

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
      setIsInitialized(true); // Allow rendering the app even if initialization failed
    }
  }, [retryCount]);

  useEffect(() => {
    // Only initialize if we're in the browser
    if (typeof window === 'undefined') {
      return;
    }

    // Start connection process
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

  // Show loading state only if explicitly set to false
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

  // Show error as a dismissible notification instead of a full-screen block
  if (error) {
    return (
      <>
        {children}
        <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-red-100 p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-red-500 font-medium">Connection Error</h3>
              <p className="text-sm text-gray-600 mt-1">{error.message}</p>
            </div>
            <button
              onClick={() => {
                setRetryCount(0);
                isConnectingRef.current = false;
                void initializePolkadotApi();
              }}
              className="ml-4 px-3 py-1 text-sm bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
} 