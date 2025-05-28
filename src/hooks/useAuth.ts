'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/useWalletStore';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface AuthState {
  isLoading: boolean;
  error: PolkadotHubError | null;
}

export function useAuth() {
  const router = useRouter();
  const { selectedAccount } = useWalletStore();
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
  });

  const login = async () => {
    try {
      setAuthState({ isLoading: true, error: null });

      if (!selectedAccount) {
        throw new PolkadotHubError(
          'No account selected',
          ErrorCodes.WALLET.NOT_FOUND,
          'Please connect your wallet first.'
        );
      }

      // Perform any additional authentication steps here
      // For example, signing a message or making an API call

      setAuthState({ isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof PolkadotHubError
        ? err
        : new PolkadotHubError(
            err instanceof Error ? err.message : 'Failed to authenticate',
            ErrorCodes.AUTH.NOT_AUTHENTICATED,
            'Please try again.'
          );
      setAuthState({ isLoading: false, error });
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState({ isLoading: true, error: null });
      // Perform any cleanup or API calls needed for logout
      setAuthState({ isLoading: false, error: null });
      router.push('/');
    } catch (err) {
      const error = err instanceof PolkadotHubError
        ? err
        : new PolkadotHubError(
            err instanceof Error ? err.message : 'Failed to logout',
            ErrorCodes.AUTH.SESSION_EXPIRED,
            'Please try again.'
          );
      setAuthState({ isLoading: false, error });
      throw error;
    }
  };

  return {
    isAuthenticated: !!selectedAccount,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    logout,
  };
} 