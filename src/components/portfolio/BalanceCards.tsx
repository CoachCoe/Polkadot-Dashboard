'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService, type PortfolioBalance } from '@/services/portfolioService';
import { Card } from '@/components/ui/Card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatBalance } from '@polkadot/util';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

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

  const mainCards = [
    {
      title: 'Total Balance',
      value: formatBalance(balance.total, { withUnit: 'DOT' }),
      description: 'Total value of all assets',
      link: selectedAccount ? `https://polkadot.subscan.io/account/${selectedAccount.address}` : undefined
    },
    {
      title: 'Available',
      value: formatBalance(balance.available, { withUnit: 'DOT' }),
      description: 'Available for transfer'
    },
    {
      title: 'Total Locked',
      value: formatBalance(balance.locked.total, { withUnit: 'DOT' }),
      description: 'Total value locked'
    }
  ];

  const lockCards = [
    {
      title: 'Staking',
      value: formatBalance(balance.locked.staking, { withUnit: 'DOT' }),
      description: 'Locked in staking',
      link: selectedAccount ? `https://polkadot.subscan.io/account/${selectedAccount.address}?tab=staking` : undefined
    },
    {
      title: 'Democracy',
      value: formatBalance(balance.locked.democracy, { withUnit: 'DOT' }),
      description: 'Locked in democracy',
      link: selectedAccount ? `https://polkadot.subscan.io/account/${selectedAccount.address}?tab=democracy` : undefined
    },
    {
      title: 'Governance',
      value: formatBalance(balance.locked.governance, { withUnit: 'DOT' }),
      description: 'Locked in governance'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mainCards.map((card) => (
          <Card key={card.title} className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
              {card.link && (
                <Link
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
            <p className="mt-1 text-sm text-gray-500">{card.description}</p>
          </Card>
        ))}
      </div>

      <h3 className="text-lg font-semibold mt-6">Locked Balances</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {lockCards.map((card) => (
          <Card key={card.title} className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
              {card.link && (
                <Link
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
            <p className="mt-1 text-sm text-gray-500">{card.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
} 