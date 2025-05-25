'use client';

import { useState, useEffect } from 'react';
import { projectStatsService } from '@/services/projectStats';
import { PolkadotHubError } from '@/utils/errorHandling';

interface UseProjectStatsResult {
  stats: {
    tvl?: string;
    monthlyActiveUsers?: number;
    monthlyTransactions?: number;
    price?: string;
    marketCap?: string;
    volume24h?: string;
  };
  isLoading: boolean;
  error: PolkadotHubError | null;
  refresh: () => Promise<void>;
}

export function useProjectStats(projectId: string, chainId?: string): UseProjectStatsResult {
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PolkadotHubError | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await projectStatsService.getProjectStats(projectId, chainId);
      setStats(data);
    } catch (err) {
      setError(
        err instanceof PolkadotHubError
          ? err
          : new PolkadotHubError(
              'Failed to fetch project statistics',
              'PROJECT_STATS_ERROR',
              err instanceof Error ? err.message : undefined
            )
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [projectId, chainId]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats
  };
} 