import { NextRequest, NextResponse } from 'next/server';
import { coingeckoApi } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

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
      return NextResponse.json({});
    }

    return NextResponse.json({
      price: `$${data.usd.toFixed(2)}`,
      marketCap: `$${Math.round(data.usd_market_cap).toLocaleString()}`,
      volume24h: `$${Math.round(data.usd_24h_vol).toLocaleString()}`
    });
  } catch (error) {
    console.error('Error fetching Coingecko data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
} 