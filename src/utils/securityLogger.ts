import { PolkadotHubError } from './errorHandling';

export enum SecurityEventType {
  AUTH_ATTEMPT = 'auth_attempt',
  INVALID_TOKEN = 'invalid_token',
  INVALID_ORIGIN = 'invalid_origin',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_IP = 'suspicious_ip',
  INVALID_INPUT = 'invalid_input',
  API_ERROR = 'API_ERROR',
  MIDDLEWARE_ERROR = 'middleware_error',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  WALLET_CONNECT = 'WALLET_CONNECT',
  WALLET_DISCONNECT = 'WALLET_DISCONNECT',
  TRANSACTION_SUBMIT = 'TRANSACTION_SUBMIT',
  TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS',
  TRANSACTION_FAILURE = 'TRANSACTION_FAILURE',
  GOVERNANCE_VOTE = 'GOVERNANCE_VOTE',
  GOVERNANCE_DELEGATE = 'GOVERNANCE_DELEGATE',
  GOVERNANCE_UNDELEGATE = 'GOVERNANCE_UNDELEGATE',
  WALLET_ERROR = 'WALLET_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SECURITY_EVENT = 'SECURITY_EVENT'
}

interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  ip?: string;
  userId?: string;
  details: Record<string, any>;
  error?: PolkadotHubError;
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private suspiciousIPs: Set<string> = new Set();
  private failedAttempts: Map<string, { count: number; firstAttempt: number }> = new Map();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly BLOCK_DURATION = 3600000; // 1 hour in milliseconds
  private events: SecurityEvent[] = [];

  private constructor() {}

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  async logEvent(event: SecurityEvent): Promise<void> {
    this.events.push(event);
    const logEntry = {
      ...event,
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
      console.log('[Security Event]', logEntry);
      return;
    }

    try {
      // In production, send to your logging service
      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      // Fallback to console in case of API failure
      console.error('[Security Event Logging Failed]', error);
      console.log('[Security Event Fallback]', logEntry);
    }

    // Track suspicious activity
    if (event.ip) {
      this.trackSuspiciousActivity(event.ip, event.type);
    }
  }

  private trackSuspiciousActivity(ip: string, eventType: SecurityEventType): void {
    const key = `${ip}:${eventType}`;
    const attempts = this.failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };

    // Reset if block duration has passed
    if (Date.now() - attempts.firstAttempt > this.BLOCK_DURATION) {
      attempts.count = 1;
      attempts.firstAttempt = Date.now();
    } else {
      attempts.count++;
    }

    this.failedAttempts.set(key, attempts);

    // Block IP if threshold exceeded
    if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
      this.suspiciousIPs.add(ip);
      void this.logEvent({
        type: SecurityEventType.SUSPICIOUS_IP,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          reason: 'Too many failed attempts',
          eventType,
          attempts: attempts.count
        }
      });
    }
  }

  isIPBlocked(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  async clearIPBlock(ip: string): Promise<void> {
    if (this.suspiciousIPs.has(ip)) {
      this.suspiciousIPs.delete(ip);
      // Clear associated failed attempts
      const entries = Array.from(this.failedAttempts.entries());
      for (const [key] of entries) {
        if (key.startsWith(ip)) {
          this.failedAttempts.delete(key);
        }
      }
    }
  }

  getEvents(): SecurityEvent[] {
    return [...this.events];
  }
}

export const securityLogger = SecurityLogger.getInstance(); 