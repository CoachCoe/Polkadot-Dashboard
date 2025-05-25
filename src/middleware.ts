import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from '@/utils/rateLimit'
import { securityLogger, SecurityEventType } from '@/utils/securityLogger'

const CSRF_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']
const API_ROUTES = ['/api/bridge', '/api/wallet', '/api/staking']
const ALLOWED_ORIGINS = [
  'https://polkadot-hub.com',
  'https://app.polkadot-hub.com',
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
].filter(Boolean)

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const ip = request.ip ?? 'anonymous'

  // Check if IP is blocked
  if (securityLogger.isIPBlocked(ip)) {
    await securityLogger.logEvent({
      type: SecurityEventType.SUSPICIOUS_IP,
      timestamp: new Date().toISOString(),
      ip,
      details: {
        reason: 'Blocked IP attempted access',
        path: request.nextUrl.pathname
      }
    });

    return new NextResponse(JSON.stringify({
      error: 'Access Denied',
      code: 'IP_BLOCKED',
      message: 'Your access has been temporarily blocked due to suspicious activity'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Add security headers
  const headers = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // CORS checks
  const origin = request.headers.get('origin')
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      await securityLogger.logEvent({
        type: SecurityEventType.INVALID_TOKEN,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          reason: 'Invalid origin',
          origin
        }
      });

      return new NextResponse(JSON.stringify({
        error: 'Invalid Origin',
        code: 'INVALID_ORIGIN',
        message: 'Request origin not allowed'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  }

  // Check if the request is for an API route
  if (API_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))) {
    // Rate limiting
    const { success, limit, remaining, reset } = await rateLimit(ip)

    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', reset.toString())

    if (!success) {
      await securityLogger.logEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          path: request.nextUrl.pathname
        }
      });

      return new NextResponse(JSON.stringify({
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Please try again later'
      }), {
        status: 429,
        headers: response.headers
      })
    }

    // CSRF protection for mutation methods
    if (CSRF_METHODS.includes(request.method)) {
      const csrfToken = request.headers.get('X-CSRF-Token')
      const expectedToken = process.env.NEXT_PUBLIC_CSRF_TOKEN

      if (!csrfToken || csrfToken !== expectedToken) {
        await securityLogger.logEvent({
          type: SecurityEventType.INVALID_TOKEN,
          timestamp: new Date().toISOString(),
          ip,
          details: {
            reason: 'Invalid CSRF token',
            path: request.nextUrl.pathname
          }
        });

        return new NextResponse(JSON.stringify({
          error: 'Invalid CSRF Token',
          code: 'INVALID_CSRF_TOKEN',
          message: 'Invalid or missing CSRF token'
        }), {
          status: 403,
          headers: response.headers
        })
      }
    }

    // Validate Content-Type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        await securityLogger.logEvent({
          type: SecurityEventType.INVALID_INPUT,
          timestamp: new Date().toISOString(),
          ip,
          details: {
            reason: 'Invalid Content-Type',
            contentType,
            path: request.nextUrl.pathname
          }
        });

        return new NextResponse(JSON.stringify({
          error: 'Invalid Content-Type',
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json'
        }), {
          status: 415,
          headers: response.headers
        })
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 