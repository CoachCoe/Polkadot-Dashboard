'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService, type PortfolioBalance } from '@/services/portfolioService';
import { Card } from '@/components/ui/Card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatBalance } from '@polkadot/util';

interface BalanceCardsProps {
  className?: string;
  balance?: PortfolioBalance;
  isLoading?: boolean;
}

export function BalanceCards({ className, balance: initialBalance, isLoading: externalLoading }: BalanceCardsProps) {
  const { selectedAccount } = useWalletStore();
  const [balance, setBalance] = useState<PortfolioBalance | null>(initialBalance || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBalanceUpdate = (newBalance: string) => {
    if (balance) {
      setBalance({
        ...balance,
        total: newBalance
      });
    }
  };

  useWebSocket({
    onBalanceChange: handleBalanceUpdate
  });

  useEffect(() => {
    if (selectedAccount && !initialBalance) {
      void loadBalance();
    }
  }, [selectedAccount, initialBalance]);

  const loadBalance = async () => {
    if (!selectedAccount) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await portfolioService.getBalance(selectedAccount.address);
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || externalLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const cards = [
    {
      title: 'Total Balance',
      value: formatBalance(balance.total, { withUnit: 'DOT' }),
      description: 'Total value of all assets'
    },
    {
      title: 'Available',
      value: formatBalance(balance.available || '0', { withUnit: 'DOT' }),
      description: 'Available for transfer'
    },
    {
      title: 'Locked',
      value: formatBalance(balance.locked, { withUnit: 'DOT' }),
      description: 'Locked in staking, governance, etc.'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {cards.map((card) => (
        <Card key={card.title} className="p-6">
          <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
          <p className="mt-1 text-sm text-gray-500">{card.description}</p>
        </Card>
      ))}
    </div>
  );
} 