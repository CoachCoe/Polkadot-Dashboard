import { NextRequest, NextResponse } from 'next/server';
import { getChainStats } from '@/data/chainStats';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const chainId = url.searchParams.get('chainId');
    
    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      );
    }

    const data = getChainStats(chainId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching chain stats:', error);
    return NextResponse.json({
      monthlyTransactions: 0,
      monthlyActiveUsers: 0,
      isStale: true
    });
  }
} 