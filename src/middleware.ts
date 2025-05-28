import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from '@/utils/rateLimit'
import { securityLogger, SecurityEventType } from '@/utils/securityLogger'
import { inputSanitizer } from '@/utils/inputSanitizer'

const CSRF_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']
const API_ROUTES = ['/api/bridge', '/api/wallet', '/api/staking', '/api/auth']
const ALLOWED_ORIGINS = [
  'https://polkadot-hub.com',
  'https://app.polkadot-hub.com',
  process.env.NEXT_PUBLIC_APP_URL,
  ...(process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'] 
    : [])
].filter(Boolean)

const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), midi=(), magnetometer=(), accelerometer=(), gyroscope=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.polkadot.io https://api.coingecko.com wss://rpc.polkadot.io https://va.vercel-scripts.com;
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `.replace(/\s+/g, ' ').trim()
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
  const path = request.nextUrl.pathname

  try {
    // Check if IP is blocked
    if (securityLogger.isIPBlocked(ip)) {
      await securityLogger.logEvent({
        type: SecurityEventType.SUSPICIOUS_IP,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          reason: 'Blocked IP attempted access',
          path
        }
      })

      return new NextResponse(JSON.stringify({
        error: 'Access Denied',
        code: 'IP_BLOCKED',
        message: 'Your access has been temporarily blocked due to suspicious activity'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // CORS checks
    const origin = request.headers.get('origin')
    if (origin) {
      if (!ALLOWED_ORIGINS.includes(origin)) {
        await securityLogger.logEvent({
          type: SecurityEventType.INVALID_ORIGIN,
          timestamp: new Date().toISOString(),
          ip,
          details: {
            origin,
            path
          }
        })

        return new NextResponse(JSON.stringify({
          error: 'Invalid Origin',
          code: 'INVALID_ORIGIN',
          message: 'Origin not allowed'
        }), {
          status: 403,
          headers: response.headers
        })
      }

      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Allow-Credentials', 'true')

      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 204,
          headers: response.headers
        })
      }
    }

    // Rate limiting for API routes
    if (API_ROUTES.some(route => path.startsWith(route))) {
      const { success, limit, remaining } = await rateLimit(ip, path)
      
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())

      if (!success) {
        await securityLogger.logEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          timestamp: new Date().toISOString(),
          ip,
          details: {
            path
          }
        })

        return new NextResponse(JSON.stringify({
          error: 'Rate Limit Exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests'
        }), {
          status: 429,
          headers: response.headers
        })
      }
    }

    // CSRF protection for state-changing methods
    if (CSRF_METHODS.includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token')
      const expectedToken = process.env.NEXT_PUBLIC_CSRF_TOKEN

      if (!csrfToken || csrfToken !== expectedToken) {
        await securityLogger.logEvent({
          type: SecurityEventType.INVALID_TOKEN,
          timestamp: new Date().toISOString(),
          ip,
          details: {
            path
          }
        })

        return new NextResponse(JSON.stringify({
          error: 'Invalid CSRF Token',
          code: 'INVALID_TOKEN',
          message: 'Missing or invalid CSRF token'
        }), {
          status: 403,
          headers: response.headers
        })
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
              path
            }
          })

          return new NextResponse(JSON.stringify({
            error: 'Invalid Content-Type',
            code: 'INVALID_CONTENT_TYPE',
            message: 'Content-Type must be application/json'
          }), {
            status: 415,
            headers: response.headers
          })
        }

        // Validate request body size
        const body = await request.json().catch(() => null)
        if (!body) {
          return new NextResponse(JSON.stringify({
            error: 'Invalid Request Body',
            code: 'INVALID_BODY',
            message: 'Request body must be valid JSON'
          }), {
            status: 400,
            headers: response.headers
          })
        }

        try {
          // Sanitize request body
          await inputSanitizer.sanitizeObject(body)
        } catch (error) {
          return new NextResponse(JSON.stringify({
            error: 'Invalid Request Body',
            code: 'INVALID_BODY',
            message: error instanceof Error ? error.message : 'Invalid request body format'
          }), {
            status: 400,
            headers: response.headers
          })
        }
      }
    }

    return response
  } catch (error) {
    await securityLogger.logEvent({
      type: SecurityEventType.MIDDLEWARE_ERROR,
      timestamp: new Date().toISOString(),
      ip,
      details: {
        error: String(error),
        path
      }
    })

    return new NextResponse(JSON.stringify({
      error: 'Internal Server Error',
      code: 'MIDDLEWARE_ERROR',
      message: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: response.headers
    })
  }
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
    '/((?!_next/static|_next/image|favicon.ico|public/|assets/).*)',
  ],
} 