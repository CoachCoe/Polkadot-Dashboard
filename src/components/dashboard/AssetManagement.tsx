'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TokenList } from '@/components/dashboard/TokenList';
import { homeService, type Transaction } from '@/services/homeService';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export const AssetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tokens');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    void loadTransactions();
  }, []);

  return (
    <Card className="p-8 bg-white shadow-lg rounded-xl border-0">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Asset Management</h2>
          <button
            onClick={() => void loadTransactions()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`w-5 h-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'tokens' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tokens')}
            className={activeTab === 'tokens' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' : 'border-gray-300 hover:bg-gray-50'}
          >
            Tokens
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('transactions')}
            className={activeTab === 'transactions' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' : 'border-gray-300 hover:bg-gray-50'}
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
            <div key={tx.hash} className="p-4 bg-gray-50 rounded-lg transform transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900">{tx.type}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900">{tx.amount} DOT</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}; 