import { NextRequest, NextResponse } from 'next/server';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    const apiKey = process.env.SUBSCAN_API_KEY;
    if (!apiKey) {
      throw new Error('Subscan API key not configured');
    }

    const response = await fetch(`https://polkadot.api.subscan.io/api/v2${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(body.data || {})
    });

    if (!response.ok) {
      throw new Error(`Subscan API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: String(error),
        endpoint: '/api/proxy/subscan'
      }
    });

    return NextResponse.json(
      { error: 'Failed to fetch data from Subscan' },
      { status: 500 }
    );
  }
} 