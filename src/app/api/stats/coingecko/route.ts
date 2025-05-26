import { NextRequest, NextResponse } from 'next/server';
import { getTokenPrice } from '@/data/tokenPrices';

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

    const data = getTokenPrice(projectId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching token price data:', error);
    return NextResponse.json({
      price: '$0.00',
      marketCap: '$0',
      volume24h: '$0'
    });
  }
} 