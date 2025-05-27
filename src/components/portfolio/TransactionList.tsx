'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';
import { Transaction } from '@/services/portfolioService';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.hash} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${
              tx.type === 'transfer' ? 'bg-blue-100' :
              tx.type === 'staking' ? 'bg-green-100' :
              tx.type === 'governance' ? 'bg-purple-100' :
              'bg-orange-100'
            }`}>
              {tx.type === 'transfer' ? (
                <ArrowUpIcon className="w-4 h-4 text-blue-600" />
              ) : tx.type === 'staking' ? (
                <ArrowDownIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-orange-600" />
              )}
            </div>
            <div>
              <p className="font-semibold capitalize">{tx.type}</p>
              <p className="text-sm text-gray-500">
                From: {formatAddress(tx.from)}
              </p>
              <p className="text-sm text-gray-500">
                To: {formatAddress(tx.to)}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-semibold">
              {tx.amount} DOT
            </p>
            <p className="text-sm text-gray-500">{tx.chain}</p>
            <Link
              href={tx.blockExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 inline-flex items-center space-x-1"
            >
              <span>View</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className={`ml-4 px-2 py-1 rounded text-sm ${
            tx.status === 'success' ? 'bg-green-100 text-green-700' :
            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {tx.status}
          </div>
        </div>
      ))}
    </div>
  );
} 