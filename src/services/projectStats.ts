import { PolkadotHubError } from '@/utils/errorHandling';

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

class ProjectStatsService {
  private static instance: ProjectStatsService;
  
  private constructor() {}

  static getInstance(): ProjectStatsService {
    if (!ProjectStatsService.instance) {
      ProjectStatsService.instance = new ProjectStatsService();
    }
    return ProjectStatsService.instance;
  }

  async getProjectStats(projectId: string, chainId?: string): Promise<ProjectStats> {
    try {
      const [coingeckoData, chainData, tvlData] = await Promise.all([
        this.getCoingeckoData(projectId),
        chainId ? this.getChainStats(chainId) : null,
        this.getTVLData(projectId)
      ]);

      return {
        ...coingeckoData,
        ...chainData,
        ...tvlData
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw new PolkadotHubError(
        'Failed to fetch project statistics',
        'PROJECT_STATS_ERROR',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async getCoingeckoData(projectId: string): Promise<Partial<ProjectStats>> {
    try {
      const response = await fetch(`/api/stats/coingecko?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price data: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return {
        price: data.price,
        marketCap: data.marketCap,
        volume24h: data.volume24h
      };
    } catch (error) {
      console.error('Error fetching Coingecko data:', error);
      throw new PolkadotHubError(
        'Failed to fetch price data',
        'COINGECKO_API_ERROR',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async getChainStats(chainId: string): Promise<Partial<ProjectStats>> {
    try {
      const response = await fetch(`/api/stats/subscan?chainId=${chainId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chain statistics: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return {
        monthlyActiveUsers: data.monthlyActiveUsers,
        monthlyTransactions: data.monthlyTransactions,
        transactions24h: data.transactions24h,
        uniqueUsers24h: data.uniqueUsers24h
      };
    } catch (error) {
      console.error('Error fetching chain stats:', error);
      throw new PolkadotHubError(
        'Failed to fetch chain statistics',
        'SUBSCAN_API_ERROR',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async getTVLData(projectId: string): Promise<Partial<ProjectStats>> {
    try {
      const response = await fetch(`/api/stats/defillama?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch TVL data: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return {
        tvl: data.tvl
      };
    } catch (error) {
      console.error('Error fetching TVL data:', error);
      throw new PolkadotHubError(
        'Failed to fetch TVL data',
        'DEFILLAMA_API_ERROR',
        error instanceof Error ? error.message : undefined
      );
    }
  }
}

export const projectStatsService = ProjectStatsService.getInstance(); 