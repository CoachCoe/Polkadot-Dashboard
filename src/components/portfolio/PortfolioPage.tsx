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
  const [isRetrying, setIsRetrying] = useState(false);

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
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: Error | null = null;

      while (retryCount < maxRetries) {
        try {
          const [balanceData, crossChainData, txData] = await Promise.all([
            portfolioService.getBalance(selectedAccount.address),
            portfolioService.getCrossChainBalances(selectedAccount.address),
            portfolioService.getTransactions(selectedAccount.address)
          ]);
          
          setBalance(balanceData);
          setCrossChainBalances(crossChainData);
          setTransactions(txData);
          lastError = null;
          break;
        } catch (err) {
          lastError = err as Error;
          retryCount++;
          if (retryCount < maxRetries) {
            console.warn(`Attempt ${retryCount} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          }
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error loading portfolio data:', error);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRefresh = () => {
    setIsRetrying(true);
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
            disabled={isLoading || isRetrying}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${(isLoading || isRetrying) ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : isRetrying ? 'Retrying...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading portfolio data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message}</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
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