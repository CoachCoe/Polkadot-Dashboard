import React from 'react';
import { BridgeTransaction, ChainInfo } from '@/services/bridges';

interface TransactionHistoryProps {
  transactions: BridgeTransaction[];
  chains: ChainInfo[];
  isLoading: boolean;
}

export function TransactionHistory({
  transactions,
  chains,
  isLoading
}: TransactionHistoryProps) {
  const formatAmount = (amount: string, chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return amount;

    const num = BigInt(amount);
    const divisor = BigInt(10 ** chain.decimals);
    const integerPart = num / divisor;
    const fractionalPart = num % divisor;
    return `${integerPart}.${fractionalPart.toString().padStart(chain.decimals, '0')} ${chain.symbol}`;
  };

  const getStatusColor = (status: BridgeTransaction['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-600">No bridge transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Transaction ID:</span>
              <span className="text-sm text-gray-600">{tx.id}</span>
            </div>
            <span className={`px-2 py-1 text-sm rounded-full ${getStatusColor(tx.status)}`}>
              {tx.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-medium">
                {chains.find(c => c.id === tx.fromChain)?.name || tx.fromChain}
              </p>
              <p className="text-sm text-gray-500 truncate">{tx.sender}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">To</p>
              <p className="font-medium">
                {chains.find(c => c.id === tx.toChain)?.name || tx.toChain}
              </p>
              <p className="text-sm text-gray-500 truncate">{tx.recipient}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium">
                {formatAmount(tx.amount, tx.fromChain)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">Timestamp</p>
              <p className="text-sm">
                {new Date(tx.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 