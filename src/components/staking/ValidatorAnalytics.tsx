'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { stakingService } from '@/services/stakingService';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

interface ValidatorAnalyticsProps {
  validatorAddress: string;
}

export function ValidatorAnalytics({ validatorAddress }: ValidatorAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const data = await stakingService.getValidatorAnalytics(validatorAddress);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load validator analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAnalytics();
  }, [validatorAddress]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Validator Analytics</h2>
        <div className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Validator Analytics</h2>
        <p className="text-gray-500 text-center py-8">No analytics available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Validator Analytics</h2>
        <div className="flex items-center space-x-4">
          {analytics.identity.web && (
            <Link
              href={analytics.identity.web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Website
            </Link>
          )}
          {analytics.identity.twitter && (
            <Link
              href={`https://twitter.com/${analytics.identity.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-500"
            >
              Twitter
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Identity</h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-500">Display Name:</span>{' '}
              {analytics.identity.display}
            </p>
            {analytics.identity.email && (
              <p>
                <span className="text-gray-500">Email:</span>{' '}
                {analytics.identity.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-500">Commission:</span>{' '}
              {analytics.commission}%
            </p>
            <p>
              <span className="text-gray-500">Uptime:</span>{' '}
              {analytics.performance.uptime}%
            </p>
            <p>
              <span className="text-gray-500">Slashes:</span>{' '}
              {analytics.performance.slashes}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Staking</h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-500">Total Stake:</span>{' '}
              {analytics.totalStake} DOT
            </p>
            <p>
              <span className="text-gray-500">Own Stake:</span>{' '}
              {analytics.ownStake} DOT
            </p>
            <p>
              <span className="text-gray-500">Nominators:</span>{' '}
              {analytics.nominators}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Era Performance</h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-500">Points:</span>{' '}
              {analytics.era.points}
            </p>
            <p>
              <span className="text-gray-500">Rewards:</span>{' '}
              {analytics.era.rewards} DOT
            </p>
            <p>
              <span className="text-gray-500">Blocks Produced:</span>{' '}
              {analytics.blocksProduced}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
} 