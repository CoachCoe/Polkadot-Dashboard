'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { stakingService } from '@/services/stakingService';
import { formatBalance } from '@polkadot/util';
import { format } from 'date-fns';
import {
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface RewardsHistoryProps {
  address: string;
}

export function RewardsHistory({ address }: RewardsHistoryProps) {
  const [rewards, setRewards] = useState<{
    era: number;
    amount: string;
    timestamp: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    void loadRewards();
  }, [address]);

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const rewardsData = await stakingService.getRewardsHistory(address);
      setRewards(rewardsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRewards = rewards.reduce(
    (sum, reward) => sum + parseFloat(reward.amount),
    0
  ).toString();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Total Rewards</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {formatBalance(totalRewards, { decimals: 10 })} DOT
        </p>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      <div className="space-y-4">
        {rewards.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No rewards history found
          </Card>
        ) : (
          rewards.map((reward) => (
            <Card key={`${reward.era}-${reward.timestamp}`} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Era {reward.era}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(reward.timestamp, 'PPpp')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatBalance(reward.amount, { decimals: 10 })} DOT
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 