'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'bridge';
  amount: string;
  symbol: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  from: string;
  to: string;
  chain: string;
}

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

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${
              tx.type === 'receive' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {tx.type === 'receive' ? (
                <ArrowDownIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowUpIcon className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-semibold capitalize">{tx.type}</p>
              <p className="text-sm text-gray-500">
                {tx.type === 'receive' ? 'From: ' : 'To: '}
                {tx.type === 'receive' ? tx.from : tx.to}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-semibold">
              {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
            </p>
            <p className="text-sm text-gray-500">{tx.chain}</p>
          </div>

          <div className={`ml-4 px-2 py-1 rounded text-sm ${
            tx.status === 'completed' ? 'bg-green-100 text-green-700' :
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