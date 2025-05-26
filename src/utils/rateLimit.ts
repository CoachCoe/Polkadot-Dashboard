import { securityLogger, SecurityEventType } from './securityLogger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDuration: number;
}

const ENDPOINTS: { [key: string]: RateLimitConfig } = {
  '/api/auth': {
    windowMs: 60 * 1000,
    maxRequests: 5,
    blockDuration: 15 * 60 * 1000
  },
  '/api/proxy/coingecko': {
    windowMs: 60 * 1000,
    maxRequests: 30,
    blockDuration: 5 * 60 * 1000
  },
  '/api/proxy/subscan': {
    windowMs: 60 * 1000,
    maxRequests: 20,
    blockDuration: 5 * 60 * 1000
  },
  'default': {
    windowMs: 60 * 1000,
    maxRequests: 60,
    blockDuration: 5 * 60 * 1000
  }
};

class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]>;
  private blocked: Map<string, number>;

  private constructor() {
    this.requests = new Map();
    this.blocked = new Map();
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private getConfig(path: string): RateLimitConfig {
    const config = ENDPOINTS[path] || ENDPOINTS['default'];
    if (!config) {
      throw new Error(`No rate limit config found for path: ${path}`);
    }
    return config;
  }

  private isBlocked(ip: string): boolean {
    const blockUntil = this.blocked.get(ip);
    if (!blockUntil) return false;
    
    if (Date.now() >= blockUntil) {
      this.blocked.delete(ip);
      return false;
    }
    return true;
  }

  private blockIp(ip: string, duration: number): void {
    const blockUntil = Date.now() + duration;
    this.blocked.set(ip, blockUntil);
    
    void securityLogger.logEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      timestamp: new Date().toISOString(),
      ip,
      details: {
        action: 'ip_blocked',
        duration,
        reason: 'Rate limit exceeded'
      }
    });
  }

  async checkRateLimit(ip: string, path: string): Promise<{ 
    success: boolean;
    limit: number;
    remaining: number;
    reset?: number;
  }> {
    try {
      if (this.isBlocked(ip)) {
        return { success: false, limit: 0, remaining: 0 };
      }

      const config = this.getConfig(path);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      let requests = this.requests.get(ip) || [];
      requests = requests.filter(time => time > windowStart);

      if (requests.length >= config.maxRequests) {
        this.blockIp(ip, config.blockDuration);
        
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          reset: Math.floor((windowStart + config.windowMs) / 1000)
        };
      }

      requests.push(now);
      this.requests.set(ip, requests);

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - requests.length,
        reset: Math.floor((windowStart + config.windowMs) / 1000)
      };
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          error: String(error),
          path
        }
      });

      return {
        success: true,
        limit: 9999,
        remaining: 9999
      };
    }
  }

  clearRateLimit(ip: string): void {
    this.requests.delete(ip);
    this.blocked.delete(ip);
  }
}

export const rateLimiter = RateLimiter.getInstance();

export const rateLimit = async (ip: string, path: string) => {
  return rateLimiter.checkRateLimit(ip, path);
}; 