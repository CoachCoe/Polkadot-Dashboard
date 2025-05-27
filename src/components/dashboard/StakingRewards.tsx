'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useWalletStore } from '@/store/useWalletStore';
import { portfolioService } from '@/services/portfolioService';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';

interface StakingRewardsData {
  total: string;
  lastReward: string;
  apr: number;
  nextPayoutDate: number;
}

export function StakingRewards() {
  const { selectedAccount } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);
  const [rewards, setRewards] = useState<StakingRewardsData | null>(null);

  useEffect(() => {
    async function loadStakingRewards() {
      if (!selectedAccount) return;
      
      try {
        setIsLoading(true);
        const data = await portfolioService.getStakingRewards(selectedAccount.address);
        setRewards(data);
      } catch (error) {
        console.error('Failed to load staking rewards:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadStakingRewards();
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Staking Rewards</h2>
        <div className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
    );
  }

  if (!rewards) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Staking Rewards</h2>
        <p className="text-gray-500 text-center py-8">No staking rewards found</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Staking Rewards</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Rewards</p>
          <p className="text-2xl font-bold">{rewards.total} DOT</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Current APR</p>
          <p className="text-2xl font-bold text-green-500">{rewards.apr}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Last Reward</p>
          <p className="text-2xl font-bold">{rewards.lastReward} DOT</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Next Payout</p>
          <p className="text-lg font-medium">
            {formatDistanceToNow(rewards.nextPayoutDate, { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  );
} 