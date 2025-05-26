import React from 'react';
import { Card } from '@/components/ui/Card';
import type { PortfolioBalance } from '@/services/portfolioService';

interface BalanceCardsProps {
  balance: PortfolioBalance;
  isLoading: boolean;
}

export function BalanceCards({ balance, isLoading }: BalanceCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Balance</h3>
          <span className="text-sm text-gray-500">DOT</span>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-gray-900">{balance.total}</span>
        </div>
        <div className="text-sm text-gray-500">
          Transferable: {balance.transferable}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Staking</h3>
          <span className="text-sm text-gray-500">DOT</span>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-gray-900">{balance.bonded}</span>
        </div>
        <div className="text-sm text-gray-500">
          Unbonding: {balance.unbonding}<br />
          Redeemable: {balance.redeemable}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Locked</h3>
          <span className="text-sm text-gray-500">DOT</span>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-gray-900">{balance.locked}</span>
        </div>
        <div className="text-sm text-gray-500">
          Democracy: {balance.democracy}
        </div>
      </Card>
    </div>
  );
} 