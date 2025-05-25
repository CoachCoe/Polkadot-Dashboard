import { PolkadotHubError } from '@/utils/errorHandling';
import axios from 'axios';
import { rateLimiter } from '@/utils/rateLimit';

interface ProjectStats {
  tvl?: string;
  monthlyActiveUsers?: number;
  monthlyTransactions?: number;
  transactions24h?: number;
  uniqueUsers24h?: number;
  price?: string;
  marketCap?: string;
  volume24h?: string;
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class ProjectStatsService {
  private static instance: ProjectStatsService;
  private readonly COINGECKO_RATE_LIMIT_KEY = 'coingecko';
  
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

  async getCoingeckoData(projectId: string): Promise<any> {
    const cacheKey = `coingecko:${projectId}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const { success } = await rateLimiter.checkLimit(this.COINGECKO_RATE_LIMIT_KEY);
      if (!success) {
        // Return cached data if available, even if expired
        const staleData = cache.get(cacheKey)?.data;
        if (staleData) {
          return staleData;
        }
        
        // Return fallback data if no cached data available
        return {
          [projectId]: {
            usd: 0,
            usd_market_cap: 0,
            usd_24h_vol: 0
          }
        };
      }
      
      // Use our backend proxy instead of calling CoinGecko directly
      const response = await fetch(`/api/stats/coingecko?projectId=${encodeURIComponent(projectId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the response to match the expected format
      const formattedData = {
        [projectId]: {
          usd: parseFloat(data.price?.replace('$', '')) || 0,
          usd_market_cap: parseFloat(data.marketCap?.replace('$', '').replace(/,/g, '')) || 0,
          usd_24h_vol: parseFloat(data.volume24h?.replace('$', '').replace(/,/g, '')) || 0
        }
      };

      this.setCachedData(cacheKey, formattedData);
      return formattedData;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Return cached data if available, even if expired
        const staleData = cache.get(cacheKey)?.data;
        if (staleData) {
          return staleData;
        }
        
        // Return fallback data if no cached data available
        return {
          [projectId]: {
            usd: 0,
            usd_market_cap: 0,
            usd_24h_vol: 0
          }
        };
      }
      
      throw new PolkadotHubError(
        'Failed to fetch price data',
        'COINGECKO_ERROR',
        error.message
      );
    }
  }

  async getProjectStats(projectId: string, chainId?: string): Promise<ProjectStats> {
    try {
      const [coingeckoData, chainData, tvlData] = await Promise.allSettled([
        this.getCoingeckoData(projectId),
        chainId ? this.getChainStats(chainId) : Promise.resolve(null),
        this.getTVLData(projectId)
      ]);

      const stats: ProjectStats = {};

      if (coingeckoData.status === 'fulfilled' && coingeckoData.value[projectId]) {
        const data = coingeckoData.value[projectId];
        stats.price = data.usd?.toString();
        stats.marketCap = data.usd_market_cap?.toString();
        stats.volume24h = data.usd_24h_vol?.toString();
      }

      if (chainData.status === 'fulfilled' && chainData.value) {
        stats.transactions24h = chainData.value.transactions24h;
        stats.uniqueUsers24h = chainData.value.uniqueUsers24h;
      }

      if (tvlData.status === 'fulfilled' && tvlData.value) {
        stats.tvl = tvlData.value.toString();
      }

      return stats;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return {};
    }
  }

  private async getChainStats(_chainId: string): Promise<any> {
    // Implementation for chain-specific stats
    return {};
  }

  private async getTVLData(_projectId: string): Promise<number | null> {
    // Implementation for TVL data
    return null;
  }
}

export const projectStatsService = ProjectStatsService.getInstance(); 