'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useAuth } from '@/hooks/useAuth';
import { PolkadotHubError } from '@/utils/errorHandling';

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
  const { connect: connectWallet, disconnect: disconnectWallet, error: walletError } = useWalletStore();
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
      await connectWallet();
      await login();
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      if (err instanceof PolkadotHubError) {
        setError(err);
      } else {
        setError(new PolkadotHubError(
          err instanceof Error ? err.message : 'Failed to connect wallet',
          'WALLET_CONNECTION_ERROR'
        ));
      }
      throw err;
    }
  };

  const disconnect = async () => {
    try {
      setError(null);
      await logout();
      await disconnectWallet();
      setIsAuthenticated(false);
    } catch (err) {
      // Still set as not authenticated even if logout fails
      setIsAuthenticated(false);
      if (err instanceof PolkadotHubError) {
        setError(err);
      } else {
        setError(new PolkadotHubError(
          err instanceof Error ? err.message : 'Failed to disconnect wallet',
          'WALLET_DISCONNECT_ERROR'
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