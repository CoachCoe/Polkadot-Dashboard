import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import polkadotApiService from '@/services/polkadotApiService';
import type { RewardHistory } from '@/types/staking';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatBalance, BN } from '@polkadot/util';
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export function StakingAnalytics() {
  const { selectedAccount } = useWalletStore();
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      void loadRewardHistory();
    }
  }, [selectedAccount]);

  const loadRewardHistory = async () => {
    if (!selectedAccount) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get current era from staking info
      const stakingInfo = await polkadotApiService.getStakingInfo();
      const currentEra = stakingInfo.activeEra;
      
      // Get last 30 eras of rewards
      const startEra = Math.max(1, currentEra - 30);
      const rewards = await polkadotApiService.getHistoricalRewards(
        startEra,
        currentEra
      );

      setRewardHistory(rewards.map(r => ({
        era: r.era,
        amount: r.reward
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reward history');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    if (rewardHistory.length === 0) return null;

    const nonZeroRewards = rewardHistory.filter(r => r.amount !== '0');
    
    if (nonZeroRewards.length === 0) {
      return {
        total: '0',
        average: '0',
        max: '0',
        min: '0',
        rewardCount: 0
      };
    }

    try {
      // Convert all rewards to BN, filtering out any invalid values
      const rewardBNs = nonZeroRewards
        .map(r => {
          try {
            return new BN(r.amount);
          } catch {
            return null;
          }
        })
        .filter((bn): bn is BN => bn !== null);

      if (rewardBNs.length === 0) {
        throw new Error('No valid rewards found');
      }

      const totalRewards = new BN(0);
      const firstReward = rewardBNs[0];
      
      if (!firstReward) {
        throw new Error('No valid rewards found');
      }

      let maxReward = firstReward;
      let minReward = firstReward;

      for (const reward of rewardBNs) {
        totalRewards.iadd(reward);
        if (maxReward.lt(reward)) maxReward = reward;
        if (minReward.gt(reward)) minReward = reward;
      }

      const averageReward = totalRewards.div(new BN(rewardBNs.length));

      return {
        total: totalRewards.toString(),
        average: averageReward.toString(),
        max: maxReward.toString(),
        min: minReward.toString(),
        rewardCount: rewardBNs.length
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        total: '0',
        average: '0',
        max: '0',
        min: '0',
        rewardCount: 0
      };
    }
  };

  const stats = calculateStats();

  if (!selectedAccount) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Please connect your wallet to view staking analytics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold">Staking Analytics</h2>
          <Button
            variant="outline"
            onClick={() => void loadRewardHistory()}
            disabled={isLoading}
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Rewards</h3>
              <p className="mt-2 text-3xl font-semibold">
                {formatBalance(stats.total, { withUnit: 'DOT' })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Average per Era</h3>
              <p className="mt-2 text-3xl font-semibold">
                {formatBalance(stats.average, { withUnit: 'DOT' })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Highest Reward</h3>
              <p className="mt-2 text-3xl font-semibold">
                {formatBalance(stats.max, { withUnit: 'DOT' })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Eras with Rewards</h3>
              <p className="mt-2 text-3xl font-semibold">{stats.rewardCount}</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Reward History
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium text-gray-500">Era</th>
                  <th className="pb-2 font-medium text-gray-500">Reward</th>
                </tr>
              </thead>
              <tbody>
                {rewardHistory.map((reward) => (
                  <tr key={reward.era} className="border-b last:border-b-0">
                    <td className="py-4">{reward.era}</td>
                    <td className="py-4">
                      {formatBalance(reward.amount, { withUnit: 'DOT' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
} 