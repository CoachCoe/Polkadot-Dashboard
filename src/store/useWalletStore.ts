'use client';

import { create } from 'zustand';
import { InjectedAccount } from '@polkadot/extension-inject/types';
import { getWallets, Wallet } from '@talismn/connect-wallets';
import { web3Enable } from '@polkadot/extension-dapp';

interface WalletState {
  selectedAccount: InjectedAccount | null;
  accounts: InjectedAccount[];
  wallets: Wallet[];
  isConnected: boolean;
  setSelectedAccount: (account: InjectedAccount | null) => void;
  loadAccounts: () => Promise<void>;
}

declare global {
  interface Window {
    injectedWeb3?: Record<string, unknown>;
  }
}

export const useWalletStore = create<WalletState>((set) => ({
  selectedAccount: null,
  accounts: [],
  wallets: [],
  isConnected: false,

  setSelectedAccount: (account) => {
    set({ selectedAccount: account });
  },

  loadAccounts: async () => {
    try {
      // First enable web3
      const extensions = await web3Enable('Polkadot Dashboard');
      if (extensions.length === 0) {
        throw new Error('No compatible wallet found. Please install Polkadot.js, Talisman, or Nova Wallet.');
      }

      // Get available wallets
      const wallets = getWallets();
      const availableWallet = wallets.find((w) => w.installed);
      
      if (!availableWallet) {
        throw new Error('No compatible wallet found. Please install Polkadot.js, Talisman, or Nova Wallet.');
      }

      // Enable the wallet first
      await availableWallet.enable('Polkadot Dashboard');
      
      // Then get accounts
      const accounts = await availableWallet.getAccounts();
      const selectedAccount = accounts.length > 0 ? accounts[0] : null;
      
      set({
        accounts,
        wallets,
        isConnected: accounts.length > 0,
        selectedAccount
      } as Partial<WalletState>);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      throw error;
    }
  },
})); 