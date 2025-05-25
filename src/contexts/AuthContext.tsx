'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuth } from '@/hooks/useAuth';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: PolkadotHubError | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { selectedAccount, disconnect: disconnectWallet, error: walletError } = useWalletStore();
  const { login, logout, isLoading, error: authError } = useAuth();
  const [error, setError] = useState<PolkadotHubError | null>(null);

  useEffect(() => {
    // Check session status on mount
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.isAuthenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    // Update error state when wallet or auth errors change
    setError(walletError || authError);
  }, [walletError, authError]);

  const connect = async () => {
    try {
      setError(null);

      // Wait for selectedAccount to be available
      if (!selectedAccount) {
        throw new PolkadotHubError(
          'Please connect your wallet first',
          ErrorCodes.WALLET.NOT_CONNECTED,
          'Connect your wallet to authenticate with Polkadot Dashboard.'
        );
      }

      // Check if we're already authenticated
      if (isAuthenticated) {
        return;
      }
      
      // Attempt to login
      await login();
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      if (err instanceof PolkadotHubError) {
        setError(err);
      } else {
        setError(new PolkadotHubError(
          err instanceof Error ? err.message : 'Failed to connect wallet',
          'WALLET_CONNECTION_ERROR',
          'Please try again or refresh the page.'
        ));
      }
      throw err;
    }
  };

  const disconnect = async () => {
    try {
      setError(null);
      
      // First logout from the server
      await logout();
      
      // Then disconnect the wallet
      await disconnectWallet();
      
      // Finally, update the authentication state
      setIsAuthenticated(false);
    } catch (err) {
      // Still set as not authenticated even if logout fails
      setIsAuthenticated(false);
      if (err instanceof PolkadotHubError) {
        setError(err);
      } else {
        setError(new PolkadotHubError(
          err instanceof Error ? err.message : 'Failed to disconnect wallet',
          ErrorCodes.WALLET.DISCONNECTED,
          'Please try again or refresh the page.'
        ));
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        connect,
        disconnect
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 