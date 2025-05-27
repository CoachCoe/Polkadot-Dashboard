'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService } from '@/services/portfolioService';
import { formatDistance } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Transaction {
  hash: string;
  type: 'transfer' | 'staking' | 'governance' | 'cross-chain';
  amount: string;
  timestamp: number;
  from: string;
  to: string;
  status: 'success' | 'pending' | 'failed';
  chain: string;
  blockExplorerUrl: string;
}

export function TransactionHistory() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function loadTransactions() {
      if (!selectedAccount) return;
      
      try {
        setIsLoading(true);
        const data = await portfolioService.getRecentTransactions(selectedAccount.address);
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadTransactions();
  }, [selectedAccount]);

  function getTransactionIcon(type: Transaction['type']) {
    switch (type) {
      case 'transfer':
        return '💸';
      case 'staking':
        return '🔒';
      case 'governance':
        return '🗳️';
      case 'cross-chain':
        return '🌉';
      default:
        return '📝';
    }
  }

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </Card>
    );
  }

  if (!transactions.length) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
        <p className="text-gray-500 text-center py-8">No recent transactions found</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{getTransactionIcon(tx.type)}</span>
              <div>
                <p className="font-medium">
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  <span className="text-gray-500 ml-2">on {tx.chain}</span>
                </p>
                <p className="text-sm text-gray-500">
                  From {formatAddress(tx.from)} to {formatAddress(tx.to)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistance(tx.timestamp, new Date(), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`font-medium ${tx.status === 'success' ? 'text-green-500' : tx.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                {tx.amount} DOT
              </span>
              <Link
                href={tx.blockExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 