import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService, type PortfolioBalance } from '@/services/portfolioService';
import type { Transaction } from '@/services/portfolioService';

export function usePortfolio() {
  const { selectedAccount } = useWalletStore();
  const [balance, setBalance] = useState<PortfolioBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!selectedAccount?.address) return;

    setIsLoading(true);
    setError(null);

    try {
      const [balanceData, transactionsData] = await Promise.all([
        portfolioService.getBalance(selectedAccount.address),
        portfolioService.getTransactions(selectedAccount.address)
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [selectedAccount?.address]);

  return {
    balance,
    transactions,
    isLoading,
    error,
    refresh: fetchData
  };
} 