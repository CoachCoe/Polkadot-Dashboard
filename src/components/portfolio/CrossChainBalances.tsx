'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { CrossChainBalance } from '@/services/portfolioService';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface CrossChainBalancesProps {
  className?: string;
  balances: CrossChainBalance[];
}

export function CrossChainBalances({ className, balances }: CrossChainBalancesProps) {
  if (!balances || balances.length === 0) {
    return (
      <Card className={`${className} p-6`}>
        <h2 className="text-xl font-semibold mb-4">Cross-Chain Balances</h2>
        <div className="text-center text-gray-500">
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
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {chainBalance.logo && (
                  <div className="relative w-8 h-8">
                    <Image
                      src={chainBalance.logo}
                      alt={chainBalance.chain}
                      fill
                      className="rounded-full"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">
                    {chainBalance.chain}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {chainBalance.symbol}
                  </span>
                </div>
              </div>
              {chainBalance.explorerUrl && (
                <Link
                  href={chainBalance.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Balance</span>
                <span className="font-medium">
                  {chainBalance.balance} {chainBalance.symbol}
                </span>
              </div>
              {chainBalance.value && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Value (USD)</span>
                  <span className="font-medium">
                    ${chainBalance.value}
                  </span>
                </div>
              )}
              {chainBalance.locked && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Locked</span>
                  <span className="font-medium">
                    {chainBalance.locked} {chainBalance.symbol}
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 