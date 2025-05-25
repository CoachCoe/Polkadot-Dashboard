'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useStaking } from '@/hooks/useStaking';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface Validator {
  address: string;
  name: string;
  commission: number;
  yourStake: number;
  active: boolean;
}

interface StakingStats {
  totalStaked: number;
  yourStake: number;
  apy: number;
  rewards: number;
  validators: Validator[];
}

export default function StakingPage() {
  const { stakingInfo, isLoading, error, refresh } = useStaking();
  const [stats, setStats] = useState<StakingStats>({
    totalStaked: 0,
    yourStake: 0,
    apy: 0,
    rewards: 0,
    validators: []
  });

  useEffect(() => {
    if (stakingInfo) {
      // Convert staking info to stats format
      setStats({
        totalStaked: parseFloat(stakingInfo.stakingInfo?.total || '0'),
        yourStake: parseFloat(stakingInfo.stakingInfo?.active || '0'),
        apy: 10.5, // Example APY - this should come from the API
        rewards: 0, // Example rewards - this should come from the API
        validators: stakingInfo.validators.map((address, index) => ({
          address,
          name: `Validator ${index + 1}`,
          commission: Math.random() * 10, // Example commission - this should come from the API
          yourStake: parseFloat(stakingInfo.stakingInfo?.active || '0') / stakingInfo.validators.length,
          active: true // Example status - this should come from the API
        }))
      });
    }
  }, [stakingInfo]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorDisplay
          error={new PolkadotHubError(
            error,
            ErrorCodes.DATA.STAKING_ERROR,
            'Failed to load staking information. Please try again.'
          )}
          action={{
            label: 'Try Again',
            onClick: refresh
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Staking Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Staked</h3>
            <p className="text-2xl font-bold text-pink-600">
              {stats.totalStaked.toLocaleString()} DOT
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Stake</h3>
            <p className="text-2xl font-bold text-pink-600">
              {stats.yourStake.toLocaleString()} DOT
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">APY</h3>
            <p className="text-2xl font-bold text-pink-600">
              {stats.apy.toFixed(2)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Rewards</h3>
            <p className="text-2xl font-bold text-pink-600">
              {stats.rewards.toLocaleString()} DOT
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Validators</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Stake
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.validators.map((validator) => (
                  <tr key={validator.address}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {validator.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {validator.commission.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {validator.yourStake.toLocaleString()} DOT
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        validator.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validator.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 