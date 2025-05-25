'use client';

import { create } from 'zustand';
import type { Signer } from '@polkadot/api/types';
import { PolkadotHubError } from '@/utils/errorHandling';

interface Account {
  address: string;
  name?: string;
}

interface WalletState {
  accounts: Account[];
  selectedAccount: Account | null;
  signer: Signer | null;
  isConnecting: boolean;
  error: PolkadotHubError | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  accounts: [],
  selectedAccount: null,
  signer: null,
  isConnecting: false,
  error: null,
  connect: async () => {
    try {
      set({ isConnecting: true, error: null });
      
      // Check if window object exists (client-side)
      if (typeof window === 'undefined') {
        throw new PolkadotHubError(
          'Cannot connect wallet on server side',
          'ENVIRONMENT_ERROR',
          'Wallet connection must be initiated from client side.'
        );
      }

      // Check if extension object exists and wait for initialization
      const checkExtension = async (retries = 5, interval = 500) => {
        for (let i = 0; i < retries; i++) {
          if ((window as any).injectedWeb3 && Object.keys((window as any).injectedWeb3).length > 0) {
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        return false;
      };

      const extensionFound = await checkExtension();
      
      if (!extensionFound) {
        throw new PolkadotHubError(
          'No wallet extension found',
          'WALLET_NOT_FOUND',
          'Please install the Polkadot.js extension or another compatible wallet and refresh the page.'
        );
      }

      // Dynamically import Polkadot extension modules
      const extensionDapp = await import('@polkadot/extension-dapp');
      if (!extensionDapp) {
        throw new PolkadotHubError(
          'Wallet extension module not available',
          'EXTENSION_NOT_AVAILABLE',
          'The wallet extension module could not be loaded.'
        );
      }

      const { web3Enable, web3Accounts, web3FromAddress } = extensionDapp;
      
      // Enable with a more descriptive name and version
      const extensions = await web3Enable('Polkadot Dashboard - v1.0.0');
      console.log('Enabled extensions:', extensions);
      
      if (extensions.length === 0) {
        throw new PolkadotHubError(
          'No wallet extension found',
          'WALLET_NOT_FOUND',
          'Please install the Polkadot.js extension or another compatible wallet.'
        );
      }

      // Request accounts with explicit timeout and retries
      const getAccounts = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const accounts = await Promise.race([
              web3Accounts(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Account request timeout')), 10000)
              )
            ]);
            
            if (Array.isArray(accounts) && accounts.length > 0) {
              return accounts;
            }
            
            // If no accounts found but no error, wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            if (i === maxRetries - 1) throw err; // Throw on last retry
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          }
        }
        throw new PolkadotHubError(
          'No accounts found after retries',
          'NO_ACCOUNTS',
          'Please create or import an account in your wallet extension.'
        );
      };
      
      const allAccounts = await getAccounts();
      
      if (!Array.isArray(allAccounts) || allAccounts.length === 0) {
        throw new PolkadotHubError(
          'No accounts found',
          'NO_ACCOUNTS',
          'Please create or import an account in your wallet extension.'
        );
      }

      const formattedAccounts = allAccounts.map(acc => ({
        address: acc.address,
        name: acc.meta.name as string
      }));

      const selectedAccount = formattedAccounts[0] || null;
      let signer = null;

      if (selectedAccount) {
        try {
          const injector = await web3FromAddress(selectedAccount.address);
          
          if (!injector?.signer) {
            throw new PolkadotHubError(
              'No signer available',
              'NO_SIGNER',
              'The selected account does not support signing.'
            );
          }
          signer = injector.signer;
        } catch (err) {
          throw new PolkadotHubError(
            'Failed to get signer',
            'SIGNER_ERROR',
            'Could not get signer for the selected account. Please check your wallet extension permissions.'
          );
        }
      }

      set({ 
        accounts: formattedAccounts,
        selectedAccount,
        signer,
        error: null
      });
    } catch (error) {
      const handledError = error instanceof PolkadotHubError ? error : new PolkadotHubError(
        error instanceof Error ? error.message : 'An unknown error occurred',
        'WALLET_CONNECTION_ERROR',
        'Please try again or refresh the page.'
      );
      set({ error: handledError });
      throw handledError;
    } finally {
      set({ isConnecting: false });
    }
  },
  disconnect: () => {
    set({ 
      accounts: [],
      selectedAccount: null,
      signer: null,
      error: null,
      isConnecting: false
    });
  },
  clearError: () => {
    set({ error: null });
  }
})); 