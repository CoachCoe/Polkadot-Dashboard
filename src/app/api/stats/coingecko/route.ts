import { NextRequest, NextResponse } from 'next/server';
import { coingeckoApi } from '@/config/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const FALLBACK_DATA = {
  price: '$0.00',
  marketCap: '$0',
  volume24h: '$0'
};

export const dynamic = 'force-dynamic';

async function fetchWithRetry(projectId: string, retryCount = 0): Promise<any> {
  try {
    const response = await coingeckoApi.get('/simple/price', {
      params: {
        ids: projectId,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true
      }
    });

    const data = response.data[projectId];
    if (!data) {
      console.warn(`No data returned from CoinGecko for ${projectId}`);
      return FALLBACK_DATA;
    }

    return {
      price: `$${data.usd.toFixed(2)}`,
      marketCap: `$${Math.round(data.usd_market_cap).toLocaleString()}`,
      volume24h: `$${Math.round(data.usd_24h_vol).toLocaleString()}`
    };
  } catch (error: any) {
    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn(`CoinGecko rate limit hit for ${projectId}`);
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying after ${retryAfter}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter * 1000, RETRY_DELAY)));
        return fetchWithRetry(projectId, retryCount + 1);
      }
      
      // If we've exhausted retries, return fallback data
      console.warn(`Max retries reached for ${projectId}, returning fallback data`);
      return FALLBACK_DATA;
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const data = await fetchWithRetry(projectId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Coingecko data:', error);
    
    // Return fallback data instead of error for better UX
    return NextResponse.json(FALLBACK_DATA);
  }
} 