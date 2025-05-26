'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { stakingService } from '@/services/stakingService';
import { formatBalance } from '@polkadot/util';
import {
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface StakingStatsProps {
  address: string;
}

interface Stats {
  totalStaked: string;
  yourStake: string;
  apy: number;
  rewards: string;
  activeValidators: number;
  totalValidators: number;
}

export function StakingStats({ address }: StakingStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalStaked: '0',
    yourStake: '0',
    apy: 0,
    rewards: '0',
    activeValidators: 0,
    totalValidators: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    void loadStats();
  }, [address]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const validators = await stakingService.getValidators();
      const rewardsHistory = await stakingService.getRewardsHistory(address);

      // Calculate total rewards
      const totalRewards = rewardsHistory.reduce(
        (sum, reward) => sum + parseFloat(reward.amount),
        0
      ).toString();

      setStats({
        totalStaked: validators.reduce((sum, v) => sum + parseFloat(v.totalStake), 0).toString(),
        yourStake: validators.reduce((sum, v) => sum + parseFloat(v.ownStake), 0).toString(),
        apy: 10.5, // TODO: Calculate actual APY
        rewards: totalRewards,
        activeValidators: validators.filter(v => v.active).length,
        totalValidators: validators.length
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
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
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BanknotesIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Total Staked</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {formatBalance(stats.totalStaked, { decimals: 10 })} DOT
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Your Stake</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {formatBalance(stats.yourStake, { decimals: 10 })} DOT
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">APY</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {stats.apy.toFixed(2)}%
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Validators</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {stats.activeValidators}/{stats.totalValidators}
        </p>
        <p className="text-sm text-gray-500 mt-1">Active validators</p>
      </Card>
    </div>
  );
} 