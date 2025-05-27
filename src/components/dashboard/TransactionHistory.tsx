'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService } from '@/services/portfolioService';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { formatBalance, formatDateTime } from '@/utils/formatters';

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
  blockNumber?: number;
  fee?: string;
  module?: string;
  call?: string;
}

export function TransactionHistory() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAll, setShowAll] = useState(false);

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

  function getStatusColor(status: Transaction['status']) {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
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

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Recent Transactions</h2>
        {selectedAccount && (
          <Link
            href={`https://polkadot.subscan.io/account/${selectedAccount.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All on Explorer →
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {displayedTransactions.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{getTransactionIcon(tx.type)}</span>
              <div>
                <div className="flex items-center">
                  <p className="font-medium">
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    {tx.module && tx.call && (
                      <span className="text-gray-500 ml-1">
                        ({tx.module}.{tx.call})
                      </span>
                    )}
                  </p>
                  <span className={`ml-2 text-sm ${getStatusColor(tx.status)}`}>
                    • {tx.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  From {formatAddress(tx.from)} to {formatAddress(tx.to)}
                </p>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <span>{formatDateTime(tx.timestamp)}</span>
                  {tx.blockNumber && (
                    <>
                      <span>•</span>
                      <span>Block #{tx.blockNumber}</span>
                    </>
                  )}
                  {tx.fee && (
                    <>
                      <span>•</span>
                      <span>Fee: {formatBalance(tx.fee)} DOT</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`font-medium ${getStatusColor(tx.status)}`}>
                {formatBalance(tx.amount)} DOT
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

      {transactions.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-800"
        >
          {showAll ? 'Show Less' : `Show All (${transactions.length})`}
        </button>
      )}
    </Card>
  );
} 