import type { InjectedWindowProvider } from '@polkadot/extension-inject/types';

interface MetaMaskEthereum {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress: string | null;
  chainId: string;
}

declare global {
  interface Window {
    ethereum?: MetaMaskEthereum;
    injectedWeb3?: Record<string, InjectedWindowProvider>;
  }
} 