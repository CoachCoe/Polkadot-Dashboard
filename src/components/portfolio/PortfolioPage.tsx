'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService, type PortfolioBalance, type CrossChainBalance, type Transaction } from '@/services/portfolioService';
import { BalanceCards } from '@/components/portfolio/BalanceCards';
import { CrossChainBalances } from '@/components/portfolio/CrossChainBalances';
import { TransactionList } from '@/components/portfolio/TransactionList';
import { Button } from '@/components/ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export function PortfolioPage() {
  const { selectedAccount } = useWalletStore();
  const [balance, setBalance] = useState<PortfolioBalance | null>(null);
  const [crossChainBalances, setCrossChainBalances] = useState<CrossChainBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      void loadData();
    }
  }, [selectedAccount]);

  const loadData = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      const [balanceData, crossChainData, txData] = await Promise.all([
        portfolioService.getBalance(selectedAccount.address),
        portfolioService.getCrossChainBalances(selectedAccount.address),
        portfolioService.getTransactions(selectedAccount.address)
      ]);
      
      setBalance(balanceData);
      setCrossChainBalances(crossChainData);
      setTransactions(txData);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    void loadData();
  };

  if (!selectedAccount) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Please connect your wallet to view your portfolio.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        <div className="space-y-8">
          <BalanceCards 
            balance={balance || {
              total: '0',
              available: '0',
              transferable: '0',
              locked: {
                total: '0',
                staking: '0',
                democracy: '0',
                vesting: '0',
                governance: '0'
              },
              bonded: '0',
              unbonding: '0',
              redeemable: '0'
            }}
            isLoading={isLoading}
          />

          <CrossChainBalances
            balances={crossChainBalances}
            className="mt-8"
          />

          <TransactionList 
            transactions={transactions} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
} 