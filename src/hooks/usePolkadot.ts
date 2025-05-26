import { useState, useEffect, useCallback } from 'react';
import polkadotApiService, {
  WalletAccount,
  ChainInfo,
  StakingInfo,
  ValidatorInfo,
  TransactionStatus
} from '@/services/polkadotApiService';

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
  getStakingInfo: (address: string) => Promise<StakingInfo | null>;
  getValidators: () => Promise<ValidatorInfo[]>;
  stake: (amount: string, validators: string[]) => Promise<void>;
  unstake: (amount: string) => Promise<void>;
  withdrawUnbonded: () => Promise<void>;
}

export function usePolkadot(): UsePolkadotReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(null);
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

  const connectWallet = useCallback(async () => {
    try {
      const walletAccounts = await polkadotApiService.initializeWallet();
      setAccounts(walletAccounts);
      setIsWalletConnected(true);
      setError(null);

      // Auto-select first account if available
      const firstAccount = walletAccounts[0];
      if (firstAccount && !selectedAccount) {
        setSelectedAccount(firstAccount);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsWalletConnected(false);
    }
  }, [selectedAccount]);

  const selectAccount = useCallback((account: WalletAccount) => {
    setSelectedAccount(account);
  }, []);

  const getBalance = useCallback(async (address: string): Promise<string> => {
    try {
      return await polkadotApiService.getAccountBalance(address);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);

  const getStakingInfo = useCallback(async (address: string): Promise<StakingInfo | null> => {
    try {
      return await polkadotApiService.getStakingInfo(address);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
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
      await polkadotApiService.stake(
        selectedAccount.address,
        amount,
        validators,
        (status: TransactionStatus) => {
          // You can add transaction status handling here if needed
          console.log('Staking transaction status:', status);
        }
      );
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
      await polkadotApiService.unstake(
        selectedAccount.address,
        amount,
        (status: TransactionStatus) => {
          // You can add transaction status handling here if needed
          console.log('Unstaking transaction status:', status);
        }
      );
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
      await polkadotApiService.withdrawUnbonded(
        selectedAccount.address,
        (status: TransactionStatus) => {
          // You can add transaction status handling here if needed
          console.log('Withdraw unbonded transaction status:', status);
        }
      );
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