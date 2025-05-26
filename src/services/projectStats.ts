import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { formatBalance } from '@polkadot/util';

export interface ProjectStats {
  tvl: string;
  volume24h: string;
  transactions24h: number;
  uniqueUsers24h: number;
  monthlyTransactions: number;
  monthlyActiveUsers: number;
  price: string;
  marketCap: string;
  lastUpdate?: Date;
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class ProjectStatsService {
  private static instance: ProjectStatsService;
  private lastStats: ProjectStats | null = null;
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {}

  static getInstance(): ProjectStatsService {
    if (!ProjectStatsService.instance) {
      ProjectStatsService.instance = new ProjectStatsService();
    }
    return ProjectStatsService.instance;
  }

  private getCachedData(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
  }

  async getStats(): Promise<ProjectStats> {
    if (this.lastStats && this.lastFetch) {
      const now = new Date();
      const timeSinceLastFetch = now.getTime() - this.lastFetch.getTime();
      if (timeSinceLastFetch < this.CACHE_DURATION) {
        return this.lastStats;
      }
    }

    try {
      const [priceData, chainData] = await Promise.all([
        this.fetchPriceData(),
        this.fetchChainData()
      ]);

      const stats: ProjectStats = {
        tvl: formatBalance(chainData.totalStaked, { decimals: 10 }),
        volume24h: formatBalance(priceData.volume24h, { decimals: 10 }),
        transactions24h: 0, // This data is not available in current API responses
        uniqueUsers24h: 0, // This data is not available in current API responses
        monthlyTransactions: 0, // This data is not available in current API responses
        monthlyActiveUsers: chainData.totalAccounts,
        price: priceData.price.toString(),
        marketCap: priceData.marketCap.toString(),
        lastUpdate: new Date()
      };

      this.lastStats = stats;
      this.lastFetch = new Date();

      return stats;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch project stats',
        ErrorCodes.NETWORK.ERROR,
        'Could not load project statistics. Please try again.'
      );
    }
  }

  private async fetchPriceData(): Promise<{
    price: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
  }> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
        {
          headers: {
            'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.polkadot) {
        throw new Error('Invalid response format');
      }

      return {
        price: data.polkadot.usd,
        marketCap: data.polkadot.usd_market_cap,
        volume24h: data.polkadot.usd_24h_vol,
        priceChange24h: data.polkadot.usd_24h_change
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch price data',
        ErrorCodes.NETWORK.ERROR,
        error instanceof Error ? error.message : 'Could not fetch price data'
      );
    }
  }

  private async fetchChainData(): Promise<{
    totalStaked: number;
    activeValidators: number;
    totalAccounts: number;
  }> {
    try {
      const response = await fetch('https://api.subscan.io/api/v2/scan/staking/overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_SUBSCAN_API_KEY || ''
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data) {
        throw new Error('Invalid response format');
      }

      return {
        totalStaked: data.data.total_stake,
        activeValidators: data.data.active_validator_count,
        totalAccounts: data.data.total_account_count
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch chain data',
        ErrorCodes.NETWORK.ERROR,
        error instanceof Error ? error.message : 'Could not fetch chain data'
      );
    }
  }

  async getProjectStats(projectId: string, chainId: string): Promise<ProjectStats> {
    try {
      const cachedData = this.getCachedData(`project_${projectId}`);
      if (cachedData) {
        return cachedData;
      }

      const response = await fetch(`https://api.subscan.io/api/v2/scan/project/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_SUBSCAN_API_KEY || ''
        },
        body: JSON.stringify({ chain_id: chainId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.data) {
        throw new Error('Invalid response format');
      }

      const stats: ProjectStats = {
        tvl: data.data.tvl || '0',
        volume24h: data.data.volume_24h || '0',
        transactions24h: data.data.transactions_24h || 0,
        uniqueUsers24h: data.data.unique_users_24h || 0,
        monthlyTransactions: data.data.monthly_transactions || 0,
        monthlyActiveUsers: data.data.monthly_active_users || 0,
        price: data.data.price || '0',
        marketCap: data.data.market_cap || '0'
      };

      this.setCachedData(`project_${projectId}`, stats);
      return stats;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch project stats',
        ErrorCodes.NETWORK.ERROR,
        error instanceof Error ? error.message : 'Could not fetch project stats'
      );
    }
  }
}

export const projectStatsService = ProjectStatsService.getInstance(); 