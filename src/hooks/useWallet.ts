'use client';

import { useState } from 'react';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

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

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      const extensions = await web3Enable('Polkadot Hub');
      if (extensions.length === 0) {
        throw new PolkadotHubError(
          'No extensions found',
          ErrorCodes.WALLET.NOT_FOUND,
          'Please install the Polkadot.js extension'
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
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
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