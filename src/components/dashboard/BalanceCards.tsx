'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { homeService, type HomeData } from '@/services/homeService';
import { formatBalance } from '@polkadot/util';

interface BalanceCardsProps {
  address: string;
}

export const BalanceCards: React.FC<BalanceCardsProps> = ({ address }) => {
  const [balanceData, setBalanceData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    void loadBalances();
  }, [address]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
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
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Available Balance</h3>
        <p className="text-3xl font-bold">{formatBalance(balanceData.balance)} DOT</p>
        <p className="text-sm text-gray-500 mt-2">Live balance updates</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Total Staked</h3>
        <p className="text-3xl font-bold">{formatBalance(totalStaked.toString())} DOT</p>
        <p className="text-sm text-gray-500 mt-2">Across {balanceData.stakes.length} validators</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Recent Activity</h3>
        <p className="text-3xl font-bold">{balanceData.transactions.length}</p>
        <p className="text-sm text-gray-500 mt-2">Transactions in the last 24h</p>
      </Card>
    </div>
  );
}; 