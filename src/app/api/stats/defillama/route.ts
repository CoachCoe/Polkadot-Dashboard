import { NextRequest, NextResponse } from 'next/server';
import { defiLlamaApi } from '@/config/api';

// Map project IDs to their DefiLlama identifiers
const PROJECT_ID_MAP: Record<string, { chain?: string; protocol?: string }> = {
  'parallel': { protocol: 'parallel-finance' },
  'acala': { protocol: 'acala' },
  'astar': { chain: 'astar' },
  'moonbeam': { chain: 'moonbeam' },
  'hydradx': { protocol: 'hydradx' }
};

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const mapping = PROJECT_ID_MAP[projectId.toLowerCase()];
    if (!mapping) {
      return NextResponse.json(
        { error: `No DefiLlama mapping found for project: ${projectId}` },
        { status: 400 }
      );
    }

    let chainError: Error | null = null;
    let tvl: number | null = null;
    
    // Try chain endpoint if mapping exists
    if (mapping.chain) {
      try {
        const chainResponse = await defiLlamaApi.get(`/v2/networks/${mapping.chain}`);
        if (chainResponse.data && typeof chainResponse.data.tvl === 'number') {
          tvl = chainResponse.data.tvl;
        }
      } catch (error) {
        console.log(`Chain TVL fetch failed for ${mapping.chain}, trying protocol endpoint...`);
        chainError = error instanceof Error ? error : new Error('Chain TVL fetch failed');
      }
    }

    // Try protocol endpoint if chain failed or mapping exists
    if (!tvl && mapping.protocol) {
      try {
        const protocolResponse = await defiLlamaApi.get(`/protocol/${mapping.protocol}`);
        if (protocolResponse.data?.tvl && Array.isArray(protocolResponse.data.tvl)) {
          const lastTvl = protocolResponse.data.tvl[protocolResponse.data.tvl.length - 1];
          if (lastTvl && typeof lastTvl.totalLiquidityUSD === 'number') {
            tvl = lastTvl.totalLiquidityUSD;
          }
        }
      } catch (protocolError) {
        console.error(`Protocol TVL fetch failed for ${mapping.protocol}:`, protocolError);
        // If both endpoints fail, return a detailed error
        return NextResponse.json(
          { 
            error: 'Failed to fetch TVL data',
            details: {
              chainError: chainError?.message,
              protocolError: protocolError instanceof Error ? protocolError.message : 'Unknown protocol error',
              projectId,
              mapping
            }
          },
          { status: 500 }
        );
      }
    }

    if (tvl === null) {
      return NextResponse.json(
        { 
          error: 'No TVL data available',
          details: {
            projectId,
            mapping
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tvl: `$${Math.round(tvl).toLocaleString()}`
    });
  } catch (error) {
    console.error('Error in DeFiLlama API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 