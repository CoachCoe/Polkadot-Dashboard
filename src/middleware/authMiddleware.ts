import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authService } from '@/services/authService';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { securityConfig } from '@/config/security';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/static',
  '/images',
  '/fonts',
  '/manifest.json',
  '/robots.txt'
];

// Asset file extensions that should be public
const PUBLIC_EXTENSIONS = [
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot'
];

export async function authMiddleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const ip = request.ip ?? 'anonymous';

    // Check if the path is public
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path)) ||
        PUBLIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      await securityLogger.logEvent({
        type: SecurityEventType.AUTH_ATTEMPT,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          action: 'access_denied',
          reason: 'no_session',
          path: pathname
        }
      });

      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please log in to access this resource'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders()
          }
        }
      );
    }

    const isValid = await authService.verifySession(sessionToken);

    if (!isValid) {
      await securityLogger.logEvent({
        type: SecurityEventType.AUTH_ATTEMPT,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          action: 'access_denied',
          reason: 'invalid_session',
          path: pathname
        }
      });

      const response = new NextResponse(
        JSON.stringify({
          error: 'Invalid or expired session',
          code: 'AUTH_INVALID_SESSION',
          message: 'Your session has expired. Please log in again.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders()
          }
        }
      );

      response.cookies.delete('session_token');
      return response;
    }

    // Add security headers to valid requests
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : String(error),
        path: request.nextUrl.pathname
      }
    });

    return new NextResponse(
      JSON.stringify({
        error: 'Authentication error',
        code: 'AUTH_ERROR',
        message: 'An error occurred while processing your request'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders()
        }
      }
    );
  }
}

function getSecurityHeaders(): Record<string, string> {
  return {
    'Strict-Transport-Security': `max-age=${securityConfig.headers.strictTransportSecurity.maxAge}; includeSubDomains; preload`,
    'X-Frame-Options': securityConfig.headers.frameguard,
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': securityConfig.headers.xssProtection,
    'Referrer-Policy': securityConfig.headers.referrerPolicy,
    'Permissions-Policy': securityConfig.headers.permissionsPolicy,
    'Content-Security-Policy': securityConfig.headers.contentSecurityPolicy
  };
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 