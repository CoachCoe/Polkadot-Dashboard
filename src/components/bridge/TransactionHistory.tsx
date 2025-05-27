'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  txHash: string;
  bridgeProvider: string;
}

interface TransactionHistoryProps {
  address?: string | undefined;
}

export function TransactionHistory({ address }: TransactionHistoryProps) {
  const [transactions, setTransactions] = React.useState<BridgeTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadTransactions = async () => {
      try {
        // TODO: Replace with actual API call
        const mockTransactions: BridgeTransaction[] = [
          {
            id: '1',
            fromChain: 'Polkadot',
            toChain: 'Ethereum',
            amount: '100 DOT',
            status: 'completed',
            timestamp: Date.now() - 3600000, // 1 hour ago
            txHash: '0x123...abc',
            bridgeProvider: 'Wormhole'
          },
          {
            id: '2',
            fromChain: 'Asset Hub',
            toChain: 'Acala',
            amount: '50 DOT',
            status: 'pending',
            timestamp: Date.now() - 1800000, // 30 minutes ago
            txHash: '0x456...def',
            bridgeProvider: 'XCM'
          }
        ];
        setTransactions(mockTransactions);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setIsLoading(false);
      }
    };

    if (address) {
      loadTransactions();
    }
  }, [address]);

  if (!address) {
    return (
      <Card className="p-6 text-center">
        <p>Please connect your wallet to view transaction history.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: BridgeTransaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
      
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500">No transactions found.</p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{tx.fromChain}</span>
                    <span>→</span>
                    <span className="font-medium">{tx.toChain}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={getStatusColor(tx.status)}
                >
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </Badge>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-1 font-medium">{tx.amount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Provider:</span>
                  <span className="ml-1">{tx.bridgeProvider}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Transaction:</span>
                  <a
                    href={`https://polkadot.subscan.io/extrinsic/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    {tx.txHash}
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
} 