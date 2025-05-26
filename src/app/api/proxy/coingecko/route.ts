import { NextRequest, NextResponse } from 'next/server';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';

export async function GET(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        ...(apiKey && { 'X-CG-Pro-API-Key': apiKey })
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: String(error),
        endpoint: '/api/proxy/coingecko'
      }
    });

    return NextResponse.json(
      { error: 'Failed to fetch data from CoinGecko' },
      { status: 500 }
    );
  }
} 