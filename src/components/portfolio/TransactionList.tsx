import React from 'react';
import { Transaction } from '@/services/portfolioService';
import { Card } from '@/components/ui/Card';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <p className="text-gray-500 text-center py-8">No transactions found</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.hash} className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              {tx.type === 'send' ? (
                <ArrowUpIcon className="w-4 h-4 text-red-500" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-green-500" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {tx.type === 'send' ? 'Sent' : 'Received'} {tx.amount}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tx.status === 'failed' && (
                    <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-500">{tx.network}</span>
                </div>
              </div>
              
              <div className="mt-1 text-sm text-gray-500">
                <span className="font-mono">
                  {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 