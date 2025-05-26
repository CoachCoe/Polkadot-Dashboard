'use client';

import { create } from 'zustand';
import type { Signer } from '@polkadot/api/types';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface Account extends InjectedAccountWithMeta {
  provider?: string;
  balance?: string;
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
  setSelectedAccount: (account: Account | null) => void;
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

      // Load extension-dapp with retries and timeout
      const loadExtensionDapp = async (retries = 3, timeout = 10000) => {
        for (let i = 0; i < retries; i++) {
          try {
            const module = await Promise.race([
              import('@polkadot/extension-dapp'),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Extension load timeout')), timeout)
              )
            ]);
            return module;
          } catch (err) {
            console.warn(`Failed to load extension-dapp (attempt ${i + 1}/${retries}):`, err);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        throw new Error('Failed to load extension-dapp after retries');
      };

      const extensionDapp = await loadExtensionDapp();
      const { web3Enable, web3Accounts, web3FromAddress } = extensionDapp;
      
      // Enable with explicit timeout
      const extensions = await Promise.race([
        web3Enable('Polkadot Dashboard'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new PolkadotHubError(
            'Wallet access timeout',
            ErrorCodes.WALLET.ACCESS_DENIED,
            'The wallet did not respond in time. Please try again.'
          )), 15000)
        )
      ]);
      
      if (!extensions || extensions.length === 0) {
        throw new PolkadotHubError(
          'No wallet extension enabled',
          ErrorCodes.WALLET.ACCESS_DENIED,
          'Please allow access to your wallet when prompted.'
        );
      }

      // Wait for accounts to be available
      const waitForAccounts = async (timeout = 15000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          try {
            const accounts = await web3Accounts();
            if (accounts && accounts.length > 0) {
              return accounts;
            }
          } catch (err) {
            console.warn('Failed to get accounts, retrying...', err);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new PolkadotHubError(
          'No accounts found',
          ErrorCodes.WALLET.NO_ACCOUNTS,
          'Please create or import an account in your wallet extension.'
        );
      };

      const accounts = await waitForAccounts();
      
      const formattedAccounts = accounts.map(acc => ({
        ...acc,
        provider: acc.meta.source
      }));

      const selectedAccount = formattedAccounts[0] || null;
      
      if (!selectedAccount) {
        throw new PolkadotHubError(
          'No account selected',
          ErrorCodes.WALLET.NO_ACCOUNTS,
          'Please create or import an account in your wallet extension.'
        );
      }

      // Get signer with timeout and retries
      const getSigner = async (timeout = 15000, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const injector = await Promise.race([
              web3FromAddress(selectedAccount.address),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new PolkadotHubError(
                  'Signer request timeout',
                  ErrorCodes.WALLET.SIGNER_ERROR,
                  'Could not get signer for the selected account. Please try again.'
                )), timeout)
              )
            ]);
            
            if (!injector?.signer) {
              throw new PolkadotHubError(
                'No signer available',
                ErrorCodes.WALLET.NO_SIGNER,
                'The selected account does not support signing.'
              );
            }
            
            return injector.signer;
          } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        throw new PolkadotHubError(
          'Failed to get signer',
          ErrorCodes.WALLET.SIGNER_ERROR,
          'Could not get signer after multiple attempts. Please try again.'
        );
      };

      const signer = await getSigner();

      // Update state atomically
      set({ 
        accounts: formattedAccounts,
        selectedAccount,
        signer,
        error: null
      });

      // Verify the state was updated correctly
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = useWalletStore.getState();
      if (!state.selectedAccount || !state.signer) {
        throw new PolkadotHubError(
          'Wallet state update failed',
          ErrorCodes.WALLET.STATE_ERROR,
          'Failed to update wallet state. Please try again.'
        );
      }
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
  },
  setSelectedAccount: (account) => {
    set({ selectedAccount: account });
  }
})); 