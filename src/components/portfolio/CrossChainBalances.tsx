'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { CrossChainBalance } from '@/services/portfolioService';

interface CrossChainBalancesProps {
  className?: string;
  balances: CrossChainBalance[];
}

export function CrossChainBalances({ className, balances }: CrossChainBalancesProps) {
  if (!balances || balances.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6 text-center text-gray-500">
          No cross-chain balances found
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-4">Cross-Chain Balances</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {balances.map((chainBalance) => (
          <Card key={chainBalance.chain} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">
                  {chainBalance.chain}
                </h3>
                <span className="text-sm text-gray-500">
                  {chainBalance.symbol}
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium">
                  {chainBalance.balance} {chainBalance.symbol}
                </p>
                <p className="text-sm text-gray-500">
                  ≈ ${chainBalance.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 