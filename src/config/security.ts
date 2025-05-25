export const securityConfig = {
  // Application
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Security
  csrfToken: process.env.NEXT_PUBLIC_CSRF_TOKEN,
  sessionSecret: process.env.SESSION_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,

  // Rate Limiting
  rateLimiting: {
    enabled: true,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    securityLevel: process.env.SECURITY_LOG_LEVEL || 'warn',
  },

  // Allowed Origins
  allowedOrigins: [
    'https://polkadot-hub.com',
    'https://app.polkadot-hub.com',
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ].filter(Boolean),

  // Session Configuration
  session: {
    enabled: true,
    durationMs: parseInt(process.env.SESSION_DURATION_MS || '3600000', 10),
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || '5', 10),
  },

  // Security Headers
  headers: {
    strictTransportSecurity: {
      maxAge: parseInt(process.env.STRICT_TRANSPORT_SECURITY_MAX_AGE || '63072000', 10),
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:;",
    frameguard: 'SAMEORIGIN',
    nosniff: true,
    xssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  },

  // Input Validation
  validation: {
    address: {
      minLength: 42,
      maxLength: 64,
      pattern: /^(0x)?[0-9a-fA-F]{40,64}$/,
    },
    amount: {
      pattern: /^\d+(\.\d+)?$/,
      minValue: '0.000000000001', // 1 Planck
      maxValue: '1000000000', // 1B tokens
    },
    chainId: {
      pattern: /^[a-zA-Z0-9-]+$/,
      maxLength: 32,
    },
  },

  // IP Blocking
  ipBlocking: {
    enabled: process.env.ENABLE_IP_BLOCKING === 'true',
    maxFailedAttempts: 5,
    blockDurationMs: 3600000, // 1 hour
  },

  // Feature Flags
  features: {
    ipBlocking: process.env.ENABLE_IP_BLOCKING === 'true',
    rateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
    sessionManagement: process.env.ENABLE_SESSION_MANAGEMENT === 'true',
    securityLogging: process.env.ENABLE_SECURITY_LOGGING === 'true',
  },
} as const;

// Type for the security configuration
export type SecurityConfig = typeof securityConfig;

// Validation function to ensure all required security settings are present
export function validateSecurityConfig(): void {
  const requiredSettings = [
    'csrfToken',
    'sessionSecret',
    'encryptionKey',
  ];

  const missingSettings = requiredSettings.filter(
    setting => !securityConfig[setting as keyof SecurityConfig]
  );

  if (missingSettings.length > 0) {
    throw new Error(
      `Missing required security settings: ${missingSettings.join(', ')}`
    );
  }

  // Validate rate limiting settings
  if (securityConfig.rateLimiting.maxRequests <= 0) {
    throw new Error('Rate limiting maxRequests must be greater than 0');
  }

  if (securityConfig.rateLimiting.windowMs <= 0) {
    throw new Error('Rate limiting windowMs must be greater than 0');
  }

  // Validate session settings
  if (securityConfig.session.durationMs <= 0) {
    throw new Error('Session duration must be greater than 0');
  }

  if (securityConfig.session.maxSessionsPerUser <= 0) {
    throw new Error('Max sessions per user must be greater than 0');
  }
} 