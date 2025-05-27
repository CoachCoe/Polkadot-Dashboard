'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { stakingService } from '@/services/stakingService';
import { Skeleton } from '@/components/ui/Skeleton';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StakingHistoryProps {
  address: string;
}

export function StakingHistory({ address }: StakingHistoryProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [duration, setDuration] = useState<any>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const [historyData, durationData] = await Promise.all([
          stakingService.getStakingHistory(address),
          stakingService.getStakingDuration(address)
        ]);
        setHistory(historyData);
        setDuration(durationData);
      } catch (error) {
        console.error('Failed to load staking history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadHistory();
  }, [address]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Staking History</h2>
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-24" />
        </div>
      </Card>
    );
  }

  if (!history.length || !duration) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Staking History</h2>
        <p className="text-gray-500 text-center py-8">No staking history available</p>
      </Card>
    );
  }

  const chartData = history.map(item => ({
    date: format(item.timestamp, 'MMM d'),
    reward: parseFloat(item.reward)
  }));

  const totalRewards = history.reduce(
    (sum, item) => sum + parseFloat(item.reward),
    0
  );

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Staking History</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Rewards</p>
          <p className="text-2xl font-bold">{totalRewards.toFixed(4)} DOT</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Staking Duration</p>
          <p className="text-2xl font-bold">{duration.totalDays} Days</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Reward Frequency</p>
          <p className="text-2xl font-bold">Every {duration.rewardFrequency}h</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Rewards Chart</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="reward"
                stroke="#E6007A"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {duration.unbondingPeriods.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Unbonding Periods</h3>
          <div className="space-y-4">
            {duration.unbondingPeriods.map((period: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-50 rounded-lg p-4"
              >
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{period.amount} DOT</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Unlock Date</p>
                  <p className="font-medium">
                    {format(period.unlockDate, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
} 