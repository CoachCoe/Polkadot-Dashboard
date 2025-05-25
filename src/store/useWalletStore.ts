'use client';

import { create } from 'zustand';
import type { Signer } from '@polkadot/api/types';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

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

declare global {
  interface Window {
    injectedWeb3?: Record<string, unknown>;
  }
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
          ErrorCodes.ENV.ERROR,
          'Wallet connection must be initiated from client side.'
        );
      }

      // Wait for extension to be ready with timeout
      const waitForExtension = async (timeout = 3000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (window.injectedWeb3 && Object.keys(window.injectedWeb3).length > 0) {
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return false;
      };

      const extensionReady = await waitForExtension();
      if (!extensionReady) {
        throw new PolkadotHubError(
          'No wallet extension found',
          ErrorCodes.WALLET.NOT_FOUND,
          'Please install the Polkadot.js extension or another compatible wallet and refresh the page.'
        );
      }

      // Dynamically import Polkadot extension modules
      let extensionDapp;
      try {
        extensionDapp = await import('@polkadot/extension-dapp');
      } catch (err) {
        console.error('Failed to load extension-dapp:', err);
        throw new PolkadotHubError(
          'Failed to load wallet extension module',
          ErrorCodes.WALLET.EXTENSION_LOAD_ERROR,
          'Please refresh the page and try again.'
        );
      }

      if (!extensionDapp) {
        throw new PolkadotHubError(
          'Wallet extension module not available',
          ErrorCodes.WALLET.EXTENSION_NOT_AVAILABLE,
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
          ErrorCodes.WALLET.NOT_FOUND,
          'Please install the Polkadot.js extension or another compatible wallet.'
        );
      }

      // Request accounts with explicit timeout and retries
      const getAccounts = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const accounts = await Promise.race([
              web3Accounts(),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Account request timeout')), 10000)
              )
            ]);
            
            if (Array.isArray(accounts) && accounts.length > 0) {
              return accounts;
            }
            
            // If no accounts found but no error, wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.error(`Failed to get accounts (attempt ${i + 1}/${maxRetries}):`, err);
            if (i === maxRetries - 1) throw err; // Throw on last retry
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
          }
        }
        throw new PolkadotHubError(
          'No accounts found after retries',
          ErrorCodes.WALLET.NO_ACCOUNTS,
          'Please create or import an account in your wallet extension.'
        );
      };
      
      const allAccounts = await getAccounts();
      
      if (!Array.isArray(allAccounts) || allAccounts.length === 0) {
        throw new PolkadotHubError(
          'No accounts found',
          ErrorCodes.WALLET.NO_ACCOUNTS,
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
              ErrorCodes.WALLET.NO_SIGNER,
              'The selected account does not support signing.'
            );
          }
          signer = injector.signer;
        } catch (err) {
          console.error('Failed to get signer:', err);
          throw new PolkadotHubError(
            'Failed to get signer',
            ErrorCodes.WALLET.SIGNER_ERROR,
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
      console.error('Wallet connection error:', error);
      const handledError = error instanceof PolkadotHubError ? error : new PolkadotHubError(
        error instanceof Error ? error.message : 'An unknown error occurred',
        ErrorCodes.WALLET.CONNECTION_ERROR,
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