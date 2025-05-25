import { NextRequest, NextResponse } from 'next/server';
import { coingeckoApi } from '@/config/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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
      return null;
    }

    return {
      price: `$${data.usd.toFixed(2)}`,
      marketCap: `$${Math.round(data.usd_market_cap).toLocaleString()}`,
      volume24h: `$${Math.round(data.usd_24h_vol).toLocaleString()}`
    };
  } catch (error: any) {
    // Handle rate limiting
    if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
      await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter * 1000, RETRY_DELAY)));
      return fetchWithRetry(projectId, retryCount + 1);
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const data = await fetchWithRetry(projectId);
    if (!data) {
      return NextResponse.json({});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Coingecko data:', error);
    
    if (error instanceof Error) {
      const status = error.message.includes('rate limit') ? 429 : 500;
      return NextResponse.json(
        { error: 'Failed to fetch price data', details: error.message },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
} 