import axios from 'axios';

// Create axios instances with different configurations
export const coingeckoApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_COINGECKO_API_KEY 
    ? 'https://pro-api.coingecko.com/api/v3'
    : 'https://api.coingecko.com/api/v3',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    ...(process.env.NEXT_PUBLIC_COINGECKO_API_KEY && {
      'X-Cg-Pro-Api-Key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY
    })
  }
});

// Cache for API responses
const coingeckoCache = new Map<string, { data: any; timestamp: number }>();
const COINGECKO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for Subscan API responses
const subscanCache = new Map<string, { data: any; timestamp: number; stale: boolean }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_STALE_TTL = 30 * 60 * 1000; // 30 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 2;
const requestTimestamps: number[] = [];

export const subscanApi = axios.create({
  baseURL: 'https://polkadot.api.subscan.io/api/v2',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-API-Key': process.env.NEXT_PUBLIC_SUBSCAN_API_KEY || ''
  }
});

export const defiLlamaApi = axios.create({
  baseURL: 'https://api.llama.fi',
  timeout: 10000,
  headers: {
    'Accept': 'application/json'
  }
});

// Add response interceptor to handle rate limits and retries
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Rate limit handler for Subscan API
const handleRateLimit = () => {
  const now = Date.now();
  
  // Clean up old timestamps
  const validTimestamps = requestTimestamps.filter(timestamp => 
    now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Update timestamps array
  requestTimestamps.length = 0;
  requestTimestamps.push(...validTimestamps);
  
  // Check if we're within rate limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current timestamp
  requestTimestamps.push(now);
  return true;
};

// Cache handler for Subscan API
const getCachedData = (cacheKey: string): { data: any; isStale: boolean } | null => {
  const cached = subscanCache.get(cacheKey);
  if (!cached) return null;

  const now = Date.now();
  const age = now - cached.timestamp;

  // Return fresh data
  if (age < CACHE_TTL) {
    return { data: cached.data, isStale: false };
  }

  // Return stale data
  if (age < CACHE_STALE_TTL) {
    return { data: cached.data, isStale: true };
  }

  // Remove expired data
  subscanCache.delete(cacheKey);
  return null;
};

const setCachedData = (cacheKey: string, data: any) => {
  subscanCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    stale: false
  });
};

// Add request interceptor for CoinGecko API
coingeckoApi.interceptors.request.use(
  async config => {
    const cacheKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
    const cached = coingeckoCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < COINGECKO_CACHE_TTL) {
      return Promise.reject({ 
        response: { data: cached.data },
        __fromCache: true 
      });
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for CoinGecko API
coingeckoApi.interceptors.response.use(
  response => {
    const cacheKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params)}`;
    coingeckoCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    return response;
  },
  async error => {
    if (error.__fromCache) {
      return { data: error.response.data, __cached: true };
    }
    
    if (error.response?.status === 429) {
      // Return cached data if available when rate limited
      const cacheKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.params)}`;
      const cached = coingeckoCache.get(cacheKey);
      if (cached) {
        return { data: cached.data, __cached: true };
      }
    }
    return Promise.reject(error);
  }
);

// Add request interceptor for Subscan API
subscanApi.interceptors.request.use(
  async config => {
    const cacheKey = `${config.method}-${config.url}-${JSON.stringify(config.data)}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      // Return cached data with stale flag
      return Promise.reject({ 
        response: { 
          data: cachedData.data,
          headers: { 'x-cache-status': cachedData.isStale ? 'stale' : 'hit' }
        },
        __fromCache: true 
      });
    }

    if (!handleRateLimit()) {
      // Try to return stale data if available when rate limited
      const staleData = Array.from(subscanCache.entries())
        .find(([key]) => key.startsWith(`${config.method}-${config.url}`)) as [string, { data: any; timestamp: number; stale: boolean }] | undefined;
      
      if (staleData && staleData[1]) {
        return Promise.reject({
          response: {
            data: staleData[1].data,
            headers: { 'x-cache-status': 'stale' }
          },
          __fromCache: true,
          __rateLimited: true
        });
      }

      const oldestTimestamp = requestTimestamps[0];
      return Promise.reject({
        response: {
          status: 429,
          data: { 
            message: 'Rate limit exceeded',
            retryAfter: oldestTimestamp ? 
              Math.ceil((RATE_LIMIT_WINDOW - (Date.now() - oldestTimestamp)) / 1000) :
              RATE_LIMIT_WINDOW / 1000
          }
        }
      });
    }

    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for all APIs
[coingeckoApi, subscanApi, defiLlamaApi].forEach(api => {
  api.interceptors.response.use(
    response => {
      // Cache successful Subscan API responses
      if (api === subscanApi) {
        const cacheKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.data)}`;
        setCachedData(cacheKey, response.data);
      }
      return response;
    },
    async error => {
      // Return cached data if the request was rejected due to cache hit
      if (error.__fromCache) {
        return { 
          data: error.response.data,
          headers: error.response.headers,
          __cached: true,
          __stale: error.response.headers['x-cache-status'] === 'stale',
          __rateLimited: error.__rateLimited
        };
      }

      // Make sure error.config exists
      if (!error.config) {
        return Promise.reject(error);
      }

      // Initialize retry count if it doesn't exist
      if (typeof error.config.__retryCount === 'undefined') {
        error.config.__retryCount = 0;
      }

      // If we've already retried the maximum number of times, throw the error
      if (error.config.__retryCount >= MAX_RETRIES) {
        return Promise.reject(error);
      }

      // Don't retry on rate limit errors
      if (error.response?.status === 429) {
        return Promise.reject(error);
      }

      // Increment the retry count
      error.config.__retryCount++;

      // Create a delay for exponential backoff
      const backoffDelay = RETRY_DELAY * Math.pow(2, error.config.__retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));

      // Create a new promise to retry the request
      try {
        return await api.request(error.config);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
  );
}); 