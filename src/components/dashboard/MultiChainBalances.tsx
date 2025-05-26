'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService } from '@/services/portfolioService';
import { Skeleton } from '@/components/ui/Skeleton';
import Image from 'next/image';

interface ChainBalance {
  chain: string;
  symbol: string;
  balance: string;
  usdValue: string;
  logo: string;
}

export function MultiChainBalances() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);
  const [balances, setBalances] = useState<ChainBalance[]>([]);

  useEffect(() => {
    async function loadBalances() {
      if (!selectedAccount) return;
      
      try {
        setIsLoading(true);
        const data = await portfolioService.getMultiChainBalances(selectedAccount.address);
        setBalances(data);
      } catch (error) {
        console.error('Failed to load chain balances:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadBalances();
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Chain Balances</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Chain Balances</h2>
      
      <div className="space-y-4">
        {balances.map((balance) => (
          <div key={balance.chain} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12">
                <Image
                  src={balance.logo}
                  alt={balance.chain}
                  fill
                  className="rounded-full"
                />
              </div>
              <div>
                <h3 className="font-semibold">{balance.chain}</h3>
                <p className="text-sm text-gray-500">{balance.symbol}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold">{balance.balance}</p>
              <p className="text-sm text-gray-500">${balance.usdValue}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 