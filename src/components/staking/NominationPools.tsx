'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { stakingService, type NominationPool } from '@/services/stakingService';
import { formatBalance } from '@polkadot/util';
import {
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface NominationPoolsProps {
}

export function NominationPools({}: NominationPoolsProps) {
  const [pools, setPools] = useState<NominationPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<NominationPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await stakingService.getNominationPools();
      setPools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nomination pools');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) return;

    try {
      setIsLoading(true);
      setError(null);
      await stakingService.joinPool(selectedPool.id, stakeAmount);
      void loadPools();
      setStakeAmount('');
      setSelectedPool(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join pool');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Nomination Pools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Nomination Pools</h2>
        <Button
          variant="outline"
          onClick={() => void loadPools()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <Card
            key={pool.id}
            className={`p-6 cursor-pointer transition-colors ${
              selectedPool?.id === pool.id
                ? 'ring-2 ring-pink-500'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedPool(pool)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {pool.name}
                </h3>
                <p className="text-sm text-gray-500">Pool #{pool.id}</p>
              </div>
              <span className={`text-sm px-2 py-1 rounded ${
                pool.state === 'Open'
                  ? 'bg-green-100 text-green-800'
                  : pool.state === 'Blocked'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {pool.state}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">APY</p>
                  <p className="font-medium">{pool.apy.toFixed(2)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="font-medium">{pool.memberCounter}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Total Staked</p>
                  <p className="font-medium">
                    {formatBalance(pool.totalStaked, { decimals: 10 })} DOT
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Commission</p>
                  <p className="font-medium">{pool.commission.current}%</p>
                </div>
              </div>
            </div>

            {selectedPool?.id === pool.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount to Stake
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => void handleStake()}
                    disabled={!stakeAmount || isLoading}
                    className="w-full"
                  >
                    Join Pool
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {pools.length === 0 && (
        <Card className="p-6 text-center text-gray-500">
          No nomination pools available
        </Card>
      )}
    </div>
  );
} 