'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';

interface AuthContextType {
  isAuthenticated: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount, connect: connectWallet, disconnect: disconnectWallet, error: walletError } = useWalletStore();
  const [error, setError] = useState<Error | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    // Update error state when wallet or auth errors change
    setError(walletError || authError);
  }, [walletError, authError]);

  const connect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setAuthError(err instanceof Error ? err : new Error('Failed to connect'));
    }
  };

  const disconnect = () => {
    disconnectWallet();
    setAuthError(null);
  };

  const clearError = () => {
    setError(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!selectedAccount,
        error,
        connect,
        disconnect,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 