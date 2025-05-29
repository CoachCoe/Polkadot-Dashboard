'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TokenList } from '@/components/dashboard/TokenList';
import { homeService, type Transaction } from '@/services/homeService';

export const AssetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tokens');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true);
        const data = await homeService.getHomeData('');
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTransactions();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Asset Management</h2>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'tokens' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tokens')}
          >
            Tokens
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </Button>
        </div>
      </div>

      {activeTab === 'tokens' ? (
        <TokenList transactions={transactions} isLoading={isLoading} />
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.hash} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">{tx.type}</span>
                <span className="font-medium">{tx.amount} DOT</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}; 