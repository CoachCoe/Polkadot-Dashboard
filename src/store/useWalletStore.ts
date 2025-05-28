'use client';

import { create } from 'zustand';
import type { WalletAccount } from '@/services/walletService';
import polkadotApiService from '@/services/polkadotApiService';

interface WalletState {
  isConnected: boolean;
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  selectAccount: (account: WalletAccount) => void;
}

declare global {
  interface Window {
    injectedWeb3?: Record<string, unknown>;
  }
}

export const useWalletStore = create<WalletState>((set) => ({
  isConnected: false,
  accounts: [],
  selectedAccount: null,
  error: null,

  connect: async () => {
    try {
      const accounts = await polkadotApiService.initializeWallet();
      set({
        isConnected: true,
        accounts,
        selectedAccount: accounts[0] || null,
        error: null
      });
    } catch (error) {
      set({
        isConnected: false,
        accounts: [],
        selectedAccount: null,
        error: error instanceof Error ? error : new Error('Failed to connect wallet')
      });
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      accounts: [],
      selectedAccount: null,
      error: null
    });
  },

  selectAccount: (account: WalletAccount) => {
    set({ selectedAccount: account });
  }
})); 