'use client';

import React, { createContext, useContext, useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';

interface AuthContextType {
  isAuthenticated: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount, loadAccounts, setSelectedAccount } = useWalletStore();
  const [error, setError] = useState<Error | null>(null);

  const login = async () => {
    try {
      setError(null);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to authenticate'));
    }
  };

  const logout = () => {
    setSelectedAccount(null);
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 