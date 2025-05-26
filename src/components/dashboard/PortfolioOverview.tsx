'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService } from '@/services/portfolioService';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

interface PortfolioStats {
  totalBalance: string;
  change24h: number;
  changePercentage24h: number;
  distribution: {
    relayChain: number;
    assetHub: number;
    parachains: number;
  };
}

export function PortfolioOverview() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PortfolioStats | null>(null);

  useEffect(() => {
    async function loadPortfolioStats() {
      if (!selectedAccount) return;
      
      try {
        setIsLoading(true);
        const data = await portfolioService.getPortfolioStats(selectedAccount.address);
        setStats(data);
      } catch (error) {
        console.error('Failed to load portfolio stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadPortfolioStats();
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-16 w-2/3" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="text-3xl font-bold">{stats.totalBalance} DOT</p>
          
          <div className="flex items-center mt-2">
            <span className={`flex items-center ${stats.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.change24h >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              )}
              {Math.abs(stats.changePercentage24h).toFixed(2)}%
            </span>
            <span className="text-gray-500 ml-2">24h change</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm text-gray-500">Relay Chain</h3>
          <p className="text-lg font-semibold mt-1">{stats.distribution.relayChain}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm text-gray-500">Asset Hub</h3>
          <p className="text-lg font-semibold mt-1">{stats.distribution.assetHub}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm text-gray-500">Parachains</h3>
          <p className="text-lg font-semibold mt-1">{stats.distribution.parachains}%</p>
        </div>
      </div>
    </Card>
  );
} 