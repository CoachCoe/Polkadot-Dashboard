'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/useWalletStore';
import { PolkadotHubError } from '@/utils/errorHandling';

interface AuthState {
  isLoading: boolean;
  error: PolkadotHubError | null;
  isInitialized: boolean;
}

export function useAuth() {
  const router = useRouter();
  const { selectedAccount, signer } = useWalletStore();
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: null,
    isInitialized: false
  });

  useEffect(() => {
    // Initialize Polkadot.js extension
    const initializeExtension = async () => {
      try {
        const { web3Enable } = await import('@polkadot/extension-dapp');
        const extensions = await web3Enable('Polkadot Dashboard');
        
        if (extensions.length === 0) {
          setAuthState(prev => ({
            ...prev,
            isInitialized: true,
            error: new PolkadotHubError(
              'No wallet extension found',
              'NO_EXTENSION',
              'Please install the Polkadot.js extension to connect your wallet.'
            )
          }));
          return;
        }

        setAuthState(prev => ({
          ...prev,
          isInitialized: true,
          error: null
        }));
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isInitialized: true,
          error: new PolkadotHubError(
            'Failed to initialize wallet extension',
            'WALLET_INIT_FAILED',
            error instanceof Error ? error.message : 'Unknown error occurred'
          )
        }));
      }
    };

    void initializeExtension();
  }, []);

  const login = useCallback(async () => {
    if (!authState.isInitialized) {
      throw new PolkadotHubError(
        'Wallet extension not initialized',
        'WALLET_NOT_INITIALIZED',
        'Please wait for the wallet extension to initialize.'
      );
    }

    if (!selectedAccount || !signer) {
      throw new PolkadotHubError(
        'Please connect your wallet first',
        'AUTH_NO_WALLET',
        'Connect your wallet to authenticate with Polkadot Dashboard.'
      );
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get challenge
      const response = await fetch(`/api/auth?address=${encodeURIComponent(selectedAccount.address)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new PolkadotHubError(
          error.message || 'Failed to get authentication challenge',
          error.code || 'AUTH_CHALLENGE_FAILED',
          error.details
        );
      }

      const { challenge } = await response.json();

      // Sign the challenge message
      if (!signer.signRaw) {
        throw new PolkadotHubError(
          'Wallet does not support message signing',
          'AUTH_SIGNING_NOT_SUPPORTED',
          'Please use a wallet that supports message signing.'
        );
      }

      const signature = await signer.signRaw({
        address: selectedAccount.address,
        data: challenge.message,
        type: 'bytes'
      });

      // Verify signature and create session
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: selectedAccount.address,
          signature: signature.signature,
          challenge
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        throw new PolkadotHubError(
          error.message || 'Authentication failed',
          error.code || 'AUTH_FAILED',
          error.details
        );
      }

      setAuthState(prev => ({ ...prev, error: null }));
    } catch (error) {
      const handledError = error instanceof PolkadotHubError ? error : new PolkadotHubError(
        'Authentication failed',
        'AUTH_FAILED',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      setAuthState(prev => ({ ...prev, error: handledError }));
      throw handledError;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [selectedAccount, signer, authState.isInitialized]);

  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new PolkadotHubError(
          error.message || 'Failed to logout',
          error.code || 'LOGOUT_FAILED',
          error.details
        );
      }

      setAuthState(prev => ({ ...prev, error: null }));
      router.push('/');
    } catch (error) {
      const handledError = error instanceof PolkadotHubError ? error : new PolkadotHubError(
        'Logout failed',
        'LOGOUT_FAILED',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      setAuthState(prev => ({ ...prev, error: handledError }));
      throw handledError;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [router]);

  return {
    isLoading: authState.isLoading,
    error: authState.error,
    isInitialized: authState.isInitialized,
    login,
    logout
  };
} 