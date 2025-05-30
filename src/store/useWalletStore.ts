'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Wallet } from '@talismn/connect-wallets';
import type { WalletState, WalletStore } from '@/types/wallet';
import { ERROR_MESSAGES } from '@/config/constants';

const initialState: WalletState = {
  selectedAccount: null,
  wallet: null,
  isConnecting: false,
  error: null,
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ...initialState,

      connect: async (wallet: Wallet) => {
        try {
          set({ isConnecting: true, error: null });

          // Get accounts from the wallet
          const accounts = await wallet.getAccounts();
          if (!accounts || accounts.length === 0) {
            throw new Error(ERROR_MESSAGES.NO_ACCOUNTS_FOUND);
          }

          // Select the first account for now
          const selectedAccount = accounts[0];

          set({
            selectedAccount,
            wallet,
            isConnecting: false,
            error: null,
          });
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          set({
            isConnecting: false,
            error: error instanceof Error ? error.message : ERROR_MESSAGES.WALLET_CONNECTION_FAILED,
          });
          throw error;
        }
      },

      disconnect: () => {
        set(initialState);
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        selectedAccount: state.selectedAccount,
      }),
    }
  )
); 