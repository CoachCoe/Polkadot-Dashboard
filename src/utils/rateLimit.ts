interface RateLimitInfo {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS = 60; // Maximum requests per minute
const tokenBuckets = new Map<string, TokenBucket>();

export async function rateLimit(identifier: string): Promise<RateLimitInfo> {
  const now = Date.now();
  const bucket = tokenBuckets.get(identifier) || {
    tokens: MAX_REQUESTS,
    lastRefill: now
  };

  // Calculate tokens to add based on time elapsed
  const timeElapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(timeElapsed / (RATE_LIMIT_WINDOW / MAX_REQUESTS));
  
  // Refill tokens
  bucket.tokens = Math.min(MAX_REQUESTS, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Check if request can be allowed
  if (bucket.tokens > 0) {
    bucket.tokens--;
    tokenBuckets.set(identifier, bucket);
    
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: bucket.tokens,
      reset: bucket.lastRefill + RATE_LIMIT_WINDOW
    };
  }

  return {
    success: false,
    limit: MAX_REQUESTS,
    remaining: 0,
    reset: bucket.lastRefill + RATE_LIMIT_WINDOW
  };
} 