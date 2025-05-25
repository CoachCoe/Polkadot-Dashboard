interface RateLimitResponse {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, { timestamps: number[]; resetTime: number }> = new Map();
  private readonly MAX_REQUESTS = 60; // 60 requests
  private readonly TIME_WINDOW = 60000; // per minute (in milliseconds)

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async checkLimit(ip: string): Promise<RateLimitResponse> {
    const now = Date.now();
    const requestInfo = this.requests.get(ip) || { timestamps: [], resetTime: now + this.TIME_WINDOW };
    
    // Clean up old timestamps
    requestInfo.timestamps = requestInfo.timestamps.filter(time => now - time < this.TIME_WINDOW);
    
    // Update reset time if window has passed
    if (now >= requestInfo.resetTime) {
      requestInfo.resetTime = now + this.TIME_WINDOW;
      requestInfo.timestamps = [];
    }

    const remaining = Math.max(0, this.MAX_REQUESTS - requestInfo.timestamps.length);
    const success = remaining > 0;

    if (success) {
      requestInfo.timestamps.push(now);
    }

    this.requests.set(ip, requestInfo);

    return {
      success,
      limit: this.MAX_REQUESTS,
      remaining,
      reset: requestInfo.resetTime
    };
  }
}

export const rateLimiter = RateLimiter.getInstance();
export const rateLimit = (ip: string) => rateLimiter.checkLimit(ip); 