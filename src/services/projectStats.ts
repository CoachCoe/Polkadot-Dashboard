import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { ProjectStats as EcosystemProjectStats } from '@/types/ecosystem';

// Mock data for static build
const STATIC_PROJECT_STATS: Record<string, EcosystemProjectStats> = {
  'polkadot': {
    tvl: 5000000000,
    dailyActiveUsers: 50000,
    totalTransactions: 1000000,
    monthlyVolume: 750000000,
    tokenPrice: 7.25,
    marketCap: 9000000000
  },
  'acala': {
    tvl: 120000000,
    dailyActiveUsers: 25000,
    totalTransactions: 150000,
    monthlyVolume: 75000000,
    tokenPrice: 0.25,
    marketCap: 25000000
  },
  'moonbeam': {
    tvl: 250000000,
    dailyActiveUsers: 50000,
    totalTransactions: 300000,
    monthlyVolume: 150000000,
    tokenPrice: 0.75,
    marketCap: 75000000
  },
  'astar': {
    tvl: 180000000,
    dailyActiveUsers: 40000,
    totalTransactions: 250000,
    monthlyVolume: 120000000,
    tokenPrice: 0.35,
    marketCap: 45000000
  }
};

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
      // For static build, return Polkadot stats
      const stats = STATIC_PROJECT_STATS['polkadot'] || {
        tvl: 0,
        dailyActiveUsers: 0,
        totalTransactions: 0,
        monthlyVolume: 0,
        tokenPrice: 0,
        marketCap: 0
      };

      this.lastStats = stats;
      this.lastFetch = new Date();
      log.info('Stats fetch completed successfully');

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

  async getProjectStats(projectId: string, _chainId: string): Promise<EcosystemProjectStats> {
    log.info(`Fetching stats for project ${projectId}`);

    try {
      const cachedData = this.getCachedData(`project_${projectId}`);
      if (cachedData) {
        log.info('Returning cached project stats');
        return cachedData;
      }

      // For static build, return mock data
      const stats = STATIC_PROJECT_STATS[projectId] || {
        tvl: 0,
        dailyActiveUsers: 0,
        totalTransactions: 0,
        monthlyVolume: 0,
        tokenPrice: 0,
        marketCap: 0
      };

      this.setCachedData(`project_${projectId}`, stats);
      log.info('Project stats fetch completed successfully');

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