'use client';

import { create } from 'zustand';
import { getWallets, type WalletAccount, type Wallet } from '@talismn/connect-wallets';

interface WalletState {
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  isConnected: boolean;
  error: string | null;
  connect: (enabledWallet?: Wallet) => Promise<void>;
  disconnect: () => void;
  setSelectedAccount: (account: WalletAccount | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  accounts: [],
  selectedAccount: null,
  isConnected: false,
  error: null,
  connect: async (enabledWallet?: Wallet) => {
    if (typeof window === 'undefined') return;
    
    try {
      let wallet = enabledWallet;
      
      if (!wallet) {
        const wallets = getWallets();
        const installedWallets = wallets.filter(w => w.installed);
        
        if (installedWallets.length === 0) {
          set({ error: 'Please install a supported wallet extension first' });
          return;
        }

        // Try to connect to the first installed wallet
        wallet = installedWallets[0];
        if (!wallet) {
          set({ error: 'No wallet available' });
          return;
        }

        // Enable the wallet if not already enabled
        await wallet.enable('Polkadot Dashboard');
      }

      // Get accounts
      const accounts = await wallet.getAccounts();
      
      if (!accounts || accounts.length === 0) {
        set({ error: 'No accounts found. Please create an account in your wallet extension' });
        return;
      }

      set({ accounts, isConnected: true, error: null });

      // If there's only one account, select it automatically
      if (accounts.length === 1) {
        set({ selectedAccount: accounts[0] ?? null });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to connect wallet. Please make sure a supported wallet extension is installed and enabled.'
      });
      throw error; // Re-throw to let the component handle the error
    }
  },
  disconnect: () => {
    set({ accounts: [], selectedAccount: null, isConnected: false, error: null });
  },
  setSelectedAccount: (account) => {
    set({ selectedAccount: account });
  },
})); 