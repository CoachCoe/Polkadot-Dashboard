import type { Wallet } from '@talismn/connect-wallets';

export interface WalletAccount {
  address: string;
  name?: string;
  source: string;
}

export interface WalletState {
  selectedAccount: WalletAccount | null;
  wallet: Wallet | null;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletStore extends WalletState {
  connect: (wallet: Wallet) => Promise<void>;
  disconnect: () => void;
  setError: (error: string | null) => void;
} 