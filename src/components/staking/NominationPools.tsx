'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { stakingService, type NominationPool } from '@/services/stakingService';
import { UsersIcon, ScaleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';

interface NominationPoolsProps {
}

export function NominationPools({}: NominationPoolsProps) {
  const [pools, setPools] = useState<NominationPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Nomination Pools</h2>
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Nomination Pools</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (!pools.length) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Nomination Pools</h2>
        <p className="text-gray-500 text-center py-8">No nomination pools available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Nomination Pools</h2>
      <div className="space-y-6">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{pool.name}</h3>
                <p className="text-sm text-gray-500">Pool #{pool.id}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-500">{pool.rewardRate}% APR</p>
                <p className="text-sm text-gray-500">{pool.commission}% Commission</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="font-medium">{pool.members}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Staked</p>
                  <p className="font-medium">{pool.totalStaked} DOT</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <ScaleIcon className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-500">Validators</p>
                  <p className="font-medium">{pool.validators.length}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Nominated Validators</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pool.validators.map((validator: string) => (
                  <span
                    key={validator}
                    className="px-2 py-1 bg-gray-200 rounded-full text-xs"
                  >
                    {validator.slice(0, 6)}...{validator.slice(-4)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 