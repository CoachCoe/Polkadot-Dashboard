'use client';

import { useState } from 'react';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null
  });

  const connect = async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Check if window.injectedWeb3 exists
      if (!window.injectedWeb3 || Object.keys(window.injectedWeb3).length === 0) {
        throw new PolkadotHubError(
          'Extension not found',
          ErrorCodes.WALLET.NOT_FOUND,
          'Please install and enable the Polkadot.js extension'
        );
      }

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      
      // Enable with a timeout
      const enablePromise = web3Enable('Polkadot Hub');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const extensions = await Promise.race([enablePromise, timeoutPromise]);
      
      if (!Array.isArray(extensions) || extensions.length === 0) {
        throw new PolkadotHubError(
          'No extensions enabled',
          ErrorCodes.WALLET.NOT_FOUND,
          'Please allow access to the Polkadot.js extension'
        );
      }

      const accounts = await web3Accounts() as InjectedAccountWithMeta[];
      if (!accounts || accounts.length === 0) {
        throw new PolkadotHubError(
          'No accounts found',
          ErrorCodes.WALLET.NO_ACCOUNTS,
          'Please create or import an account in the Polkadot.js extension'
        );
      }

      const firstAccount = accounts[0];
      if (!firstAccount || !firstAccount.address) {
        throw new PolkadotHubError(
          'Invalid account',
          ErrorCodes.WALLET.ACCOUNT_NOT_FOUND,
          'The selected account is invalid'
        );
      }

      setState({
        address: firstAccount.address,
        isConnected: true,
        isConnecting: false,
        error: null
      });
    } catch (error) {
      console.error('Wallet connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error 
          ? error.message 
          : error instanceof PolkadotHubError
            ? error.userMessage
            : 'Failed to connect wallet. Please make sure the Polkadot.js extension is installed and enabled.'
      }));
    }
  };

  const disconnect = () => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null
    });
  };

  return {
    ...state,
    connect,
    disconnect
  };
}; 