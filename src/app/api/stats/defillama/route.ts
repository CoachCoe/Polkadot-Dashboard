import { NextRequest, NextResponse } from 'next/server';

// Static TVL data for projects
const PROJECT_TVL: Record<string, string> = {
  'parallel': '$85,000,000',
  'acala': '$120,000,000',
  'astar': '$180,000,000',
  'moonbeam': '$250,000,000',
  'hydradx': '$45,000,000'
};

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId?: string } }
) {
  try {
    const projectId = params.projectId || request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const tvl = PROJECT_TVL[projectId.toLowerCase()];
    if (!tvl) {
      return NextResponse.json(
        { error: `No TVL data found for project: ${projectId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ tvl });
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