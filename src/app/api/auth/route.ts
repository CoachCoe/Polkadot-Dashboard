import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/authService';
import { inputSanitizer } from '@/utils/inputSanitizer';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, signature, message } = body;

    // Validate required fields
    if (!address) {
      throw new PolkadotHubError(
        'Missing wallet address',
        ErrorCodes.AUTH.MISSING_ADDRESS,
        'Please connect your wallet and try again.'
      );
    }

    if (!signature || !message) {
      throw new PolkadotHubError(
        'Missing required fields',
        ErrorCodes.AUTH.MISSING_FIELDS,
        'Signature and message are required.'
      );
    }

    // Verify signature and create session
    const sessionToken = await authService.authenticate(address, signature, message);

    // Log successful authentication
    await securityLogger.logEvent({
      type: SecurityEventType.AUTH_SUCCESS,
      timestamp: new Date().toISOString(),
      details: {
        address,
        message
      }
    });

    // Create response with session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    // Log authentication failure
    await securityLogger.logEvent({
      type: SecurityEventType.AUTH_FAILURE,
      timestamp: new Date().toISOString(),
      details: {
        error: String(error)
      }
    });

    if (error instanceof PolkadotHubError) {
      return NextResponse.json({ error: error.userMessage }, { status: 401 });
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
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

    const sanitizedInput = await inputSanitizer.sanitizeObject({ address });
    const challenge = await authService.generateChallenge(sanitizedInput.address);

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