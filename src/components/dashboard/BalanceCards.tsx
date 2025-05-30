'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { homeService, type HomeData } from '@/services/homeService';
import { formatBalance } from '@polkadot/util';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface BalanceCardsProps {
  address: string;
}

function safeFormatBalance(value: any) {
  try {
    if (value === undefined || value === null || value === '') return formatBalance('0');
    // If value is BN or can be converted to string
    return formatBalance(value.toString());
  } catch {
    return formatBalance('0');
  }
}

export const BalanceCards: React.FC<BalanceCardsProps> = ({ address }) => {
  const [balanceData, setBalanceData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      const data = await homeService.getHomeData(address);
      setBalanceData(data);
    } catch (error) {
      console.error('Failed to load balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBalances();
  }, [address]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 bg-white shadow-lg rounded-xl border-0 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!balanceData) {
    return null;
  }

  const totalStaked = balanceData.stakes.reduce((total, stake) => total + parseFloat(stake.amount), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="p-6 bg-white shadow-lg rounded-xl border-0 transform transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Available Balance</h3>
          <button
            onClick={() => void loadBalances()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`w-5 h-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{safeFormatBalance(balanceData.balances[0]?.available)} DOT</p>
        <p className="text-sm text-gray-500 mt-2">Live balance updates</p>
      </Card>

      <Card className="p-6 bg-white shadow-lg rounded-xl border-0 transform transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Total Staked</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{safeFormatBalance(totalStaked)} DOT</p>
        <p className="text-sm text-gray-500 mt-2">Across {balanceData.stakes.length} validators</p>
      </Card>

      <Card className="p-6 bg-white shadow-lg rounded-xl border-0 transform transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{balanceData.transactions.length}</p>
        <p className="text-sm text-gray-500 mt-2">Transactions in the last 24h</p>
      </Card>
    </div>
  );
}; 