import { NextRequest, NextResponse } from 'next/server';
import { subscanApi } from '@/config/api';
import { PolkadotHubError } from '@/utils/errorHandling';
import { AxiosError } from 'axios';

// Fallback data for when API is rate limited
const FALLBACK_DATA = {
  monthlyTransactions: 0,
  monthlyActiveUsers: 0,
  isStale: true
};

export const dynamic = 'force-dynamic';

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

    try {
      // Calculate start timestamp (30 days ago)
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

      // Get daily stats
      const response = await subscanApi.post('/scan/daily', {
        chain: chainId,
        start: thirtyDaysAgo,
        end: now,
        row: 30,
        category: 'transfer'
      });

      const data = response.data?.data;
      if (!data?.list) {
        console.warn(`Invalid data format from Subscan API for ${chainId}:`, data);
        return NextResponse.json(FALLBACK_DATA);
      }

      // Calculate monthly stats from daily data
      const monthlyStats = data.list.reduce((acc: any, day: any) => {
        return {
          transactions: acc.transactions + (parseInt(day.total_count) || 0),
          activeUsers: acc.activeUsers + (parseInt(day.active_accounts) || 0)
        };
      }, { transactions: 0, activeUsers: 0 });

      return NextResponse.json({
        monthlyTransactions: monthlyStats.transactions,
        monthlyActiveUsers: monthlyStats.activeUsers,
        isStale: false
      });
    } catch (error) {
      // If rate limited or other API error, return fallback data
      if (error instanceof PolkadotHubError || 
          (error instanceof AxiosError && error.response?.status === 429)) {
        console.warn(`Using fallback data for ${chainId} due to API error:`, error);
        return NextResponse.json(FALLBACK_DATA);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching chain stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chain statistics', isStale: true },
      { status: 500 }
    );
  }
} 