import { NextRequest, NextResponse } from 'next/server';
import { getChainStats } from '@/data/chainStats';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { chainId?: string } }
) {
  try {
    const chainId = params.chainId || request.nextUrl.searchParams.get('chainId');
    
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