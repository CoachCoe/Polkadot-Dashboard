'use client';

import React from 'react';
import { type Transaction } from '@/services/homeService';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading }) => {
  if (isLoading) {
    return <div className="text-gray-600">Loading transactions...</div>;
  }

  if (!transactions.length) {
    return <div className="text-gray-600">No transactions found</div>;
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.hash} className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{tx.type}</p>
              <p className="text-sm text-gray-500">
                {new Date(tx.timestamp).toLocaleString()}
              </p>
            </div>
            <p className="font-medium">{tx.amount}</p>
          </div>
        </div>
      ))}
    </div>
  );
}; 