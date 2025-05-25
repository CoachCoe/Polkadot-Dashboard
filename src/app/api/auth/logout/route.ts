import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/authService';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { PolkadotHubError } from '@/utils/errorHandling';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session_id')?.value;

    if (!sessionId) {
      throw new PolkadotHubError(
        'No active session',
        'AUTH_NO_SESSION'
      );
    }

    await authService.logout(sessionId);

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.delete('session_id');

    return response;
  } catch (error) {
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: String(error),
        endpoint: '/api/auth/logout'
      }
    });

    if (error instanceof PolkadotHubError) {
      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Logout failed',
        code: 'AUTH_LOGOUT_FAILED'
      },
      { status: 500 }
    );
  }
} 