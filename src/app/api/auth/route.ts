import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/authService';
import { inputSanitizer } from '@/utils/inputSanitizer';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { PolkadotHubError } from '@/utils/errorHandling';

export async function POST(request: NextRequest) {
  try {
    const { address, signature, challenge } = await request.json();
    const ip = request.ip ?? 'anonymous';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    if (!address || !signature || !challenge) {
      throw new PolkadotHubError(
        'Missing required fields',
        'AUTH_MISSING_FIELDS'
      );
    }

    const sanitizedAddress = inputSanitizer.sanitizeAddress(address);
    const sanitizedSignature = signature.replace(/[^0-9a-fA-F]/g, '');

    const isValid = await authService.verifySignature(
      sanitizedAddress,
      sanitizedSignature
    );

    if (!isValid) {
      throw new PolkadotHubError(
        'Invalid signature',
        'AUTH_INVALID_SIGNATURE'
      );
    }
    const sessionId = await authService.createSession(
      sanitizedAddress,
      ip,
      userAgent
    );

    const response = NextResponse.json(
      { sessionId },
      { status: 200 }
    );

    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 
    });

    return response;
  } catch (error) {
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: String(error),
        endpoint: '/api/auth'
      }
    });

    if (error instanceof PolkadotHubError) {
      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
          details: error.details
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address');

    if (!address) {
      throw new PolkadotHubError(
        'Missing wallet address',
        'AUTH_MISSING_ADDRESS'
      );
    }

    const sanitizedAddress = inputSanitizer.sanitizeAddress(address);
    const challenge = await authService.generateChallenge(sanitizedAddress);

    return NextResponse.json({ challenge });
  } catch (error) {
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: String(error),
        endpoint: '/api/auth'
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
        message: 'Failed to generate challenge',
        code: 'AUTH_CHALLENGE_FAILED'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
        endpoint: '/api/auth'
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