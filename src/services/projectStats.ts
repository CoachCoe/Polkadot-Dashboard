import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { ProjectStats as EcosystemProjectStats } from '@/types/ecosystem';


// Add logger
const LOG_PREFIX = '[ProjectStatsService]';
const log = {
  info: (message: string, ...args: any[]) => console.log(`${LOG_PREFIX} ${message}`, ...args),
  error: (message: string, error?: any) => console.error(`${LOG_PREFIX} ${message}`, error || ''),
  warn: (message: string, ...args: any[]) => console.warn(`${LOG_PREFIX} ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`${LOG_PREFIX} ${message}`, ...args),
  performance: (operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`${LOG_PREFIX} Performance - ${operation}: ${duration}ms`);
  }
};

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class ProjectStatsService {
  private static instance: ProjectStatsService;
  private lastStats: EcosystemProjectStats | null = null;
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {
    log.info('Initializing ProjectStatsService');
  }

  static getInstance(): ProjectStatsService {
    if (!ProjectStatsService.instance) {
      ProjectStatsService.instance = new ProjectStatsService();
    }
    return ProjectStatsService.instance;
  }

  private getCachedData(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      log.debug(`Cache hit for key: ${key}`);
      return cached.data;
    }
    log.debug(`Cache miss for key: ${key}`);
    return null;
  }

  private setCachedData(key: string, data: any) {
    log.debug(`Caching data for key: ${key}`);
    cache.set(key, { data, timestamp: Date.now() });
  }

  async getStats(): Promise<EcosystemProjectStats> {
    const startTime = Date.now();
    log.info('Fetching project stats');

    if (this.lastStats && this.lastFetch) {
      const now = new Date();
      const timeSinceLastFetch = now.getTime() - this.lastFetch.getTime();
      if (timeSinceLastFetch < this.CACHE_DURATION) {
        log.info('Returning cached stats');
        return this.lastStats;
      }
    }

    try {
      log.debug('Making API calls to fetch stats');
      const [priceData, chainData] = await Promise.all([
        fetch('/api/stats/coingecko?projectId=polkadot').then(res => res.json()),
        fetch('/api/stats/defillama?projectId=polkadot').then(res => res.json())
      ]);

      const stats: EcosystemProjectStats = {
        tvl: Number(chainData.tvl) || 0,
        dailyActiveUsers: chainData.uniqueUsers24h || 0,
        totalTransactions: chainData.monthlyTransactions || 0,
        monthlyVolume: Number(priceData.volume24h) || 0,
        tokenPrice: Number(priceData.price) || 0,
        marketCap: Number(priceData.marketCap) || 0
      };

      this.lastStats = stats;
      this.lastFetch = new Date();

      log.info('Stats fetch completed successfully');
      log.performance('getStats', startTime);

      return stats;
    } catch (error) {
      log.error('Failed to fetch project stats', error);
      throw new PolkadotHubError(
        'Failed to fetch project stats',
        ErrorCodes.NETWORK.ERROR,
        'Could not load project statistics. Please try again.'
      );
    }
  }

  async getProjectStats(projectId: string, chainId: string): Promise<EcosystemProjectStats> {
    const startTime = Date.now();
    log.info(`Fetching stats for project ${projectId} on chain ${chainId}`);

    try {
      const cachedData = this.getCachedData(`project_${projectId}`);
      if (cachedData) {
        log.info('Returning cached project stats');
        return cachedData;
      }

      log.debug('Making API call to fetch project stats');
      
      // Use our internal API endpoints instead of direct external calls
      const [priceData, chainData] = await Promise.all([
        fetch(`/api/stats/coingecko?projectId=${projectId}`).then(res => res.json()),
        fetch(`/api/stats/defillama?projectId=${projectId}&chainId=${chainId}`).then(res => res.json())
      ]);

      const stats: EcosystemProjectStats = {
        tvl: Number(chainData.tvl) || 0,
        dailyActiveUsers: chainData.uniqueUsers24h || 0,
        totalTransactions: chainData.monthlyTransactions || 0,
        monthlyVolume: Number(priceData.volume24h) || 0,
        tokenPrice: Number(priceData.price) || 0,
        marketCap: Number(priceData.marketCap) || 0
      };

      this.setCachedData(`project_${projectId}`, stats);
      
      log.info('Project stats fetch completed successfully');
      log.performance('getProjectStats', startTime);

      return stats;
    } catch (error) {
      log.error('Failed to fetch project stats', error);
      throw new PolkadotHubError(
        'Failed to fetch project stats',
        ErrorCodes.NETWORK.ERROR,
        error instanceof Error ? error.message : 'Could not fetch project stats'
      );
    }
  }
}

export const projectStatsService = ProjectStatsService.getInstance(); 