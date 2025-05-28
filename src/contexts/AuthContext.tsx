'use client';

import React, { createContext, useContext, useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';

interface AuthContextType {
  isAuthenticated: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount, connect, disconnect } = useWalletStore();
  const [error, setError] = useState<Error | null>(null);

  const login = async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to authenticate'));
      throw err;
    }
  };

  const logout = () => {
    try {
      disconnect();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to logout'));
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!selectedAccount,
        error,
        login,
        logout,
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