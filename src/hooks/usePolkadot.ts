'use client';
import { useState, useEffect, useCallback } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import polkadotApiService from '@/services/polkadotApiService';
import type { ChainInfo, StakingInfo, ValidatorInfo } from '@/types/staking';
import type { WalletAccount } from '@/services/walletService';

interface UsePolkadotReturn {
  isConnected: boolean;
  isWalletConnected: boolean;
  accounts: WalletAccount[];
  chainInfo: ChainInfo | null;
  selectedAccount: WalletAccount | null;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectWallet: () => Promise<void>;
  selectAccount: (account: WalletAccount) => void;
  getBalance: (address: string) => Promise<string>;
  getStakingInfo: () => Promise<StakingInfo | null>;
  getValidators: () => Promise<ValidatorInfo[]>;
  stake: (amount: string, validators: string[]) => Promise<void>;
  unstake: (amount: string) => Promise<void>;
  withdrawUnbonded: () => Promise<void>;
}

export function usePolkadot(): UsePolkadotReturn {
  const { selectedAccount, selectAccount: selectWalletAccount } = useWalletStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    try {
      await polkadotApiService.connect();
      setIsConnected(true);
      setChainInfo(polkadotApiService.getChainInfo());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await polkadotApiService.disconnect();
      setIsConnected(false);
      setChainInfo(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const selectAccount = useCallback((account: WalletAccount) => {
    selectWalletAccount(account);
  }, [selectWalletAccount]);

  const connectWallet = useCallback(async () => {
    try {
      const walletAccounts = await polkadotApiService.initializeWallet();
      setAccounts(walletAccounts);
      setIsWalletConnected(true);
      setError(null);

      // Auto-select first account if available
      const firstAccount = walletAccounts[0];
      if (firstAccount && !selectedAccount) {
        selectAccount(firstAccount);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsWalletConnected(false);
    }
  }, [selectedAccount, selectAccount]);

  const getBalance = useCallback(async (address: string): Promise<string> => {
    if (!address) {
      throw new Error('Address is required');
    }

    try {
      return await polkadotApiService.getAccountBalance(address);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);

  const getStakingInfo = useCallback(async (): Promise<StakingInfo | null> => {
    try {
      return await polkadotApiService.getStakingInfo();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, []);

  const getValidators = useCallback(async (): Promise<ValidatorInfo[]> => {
    try {
      return await polkadotApiService.getValidators();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);

  const stake = useCallback(async (amount: string, validators: string[]): Promise<void> => {
    if (!selectedAccount) {
      throw new Error('No account selected');
    }

    try {
      setError(null);
      await polkadotApiService.stake(amount, validators);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [selectedAccount]);

  const unstake = useCallback(async (amount: string): Promise<void> => {
    if (!selectedAccount) {
      throw new Error('No account selected');
    }

    try {
      setError(null);
      await polkadotApiService.unstake(amount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [selectedAccount]);

  const withdrawUnbonded = useCallback(async (): Promise<void> => {
    if (!selectedAccount) {
      throw new Error('No account selected');
    }

    try {
      setError(null);
      await polkadotApiService.withdrawUnbonded(selectedAccount, 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [selectedAccount]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isWalletConnected,
    accounts,
    chainInfo,
    selectedAccount,
    error,
    connect,
    disconnect,
    connectWallet,
    selectAccount,
    getBalance,
    getStakingInfo,
    getValidators,
    stake,
    unstake,
    withdrawUnbonded
  };
} 