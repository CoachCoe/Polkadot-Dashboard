import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface SecurityAuditConfig {
  maxFailedAttempts: number;
  blockDurationMs: number;
  rateLimitWindowMs: number;
  maxRequestsPerWindow: number;
}

interface SecurityMetrics {
  failedLogins: Map<string, number>;
  lastFailedAttempt: Map<string, number>;
  requestCounts: Map<string, number>;
  lastRequestTime: Map<string, number>;
}

class SecurityAuditService {
  private static instance: SecurityAuditService;
  private metrics: SecurityMetrics;
  private config: SecurityAuditConfig;

  private constructor() {
    this.metrics = {
      failedLogins: new Map(),
      lastFailedAttempt: new Map(),
      requestCounts: new Map(),
      lastRequestTime: new Map()
    };

    this.config = {
      maxFailedAttempts: 5,
      blockDurationMs: 3600000, // 1 hour
      rateLimitWindowMs: 60000, // 1 minute
      maxRequestsPerWindow: 100
    };
  }

  static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  async auditTransaction(transactionDetails: {
    type: string;
    from: string;
    to?: string;
    amount?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Log transaction attempt
      await securityLogger.logEvent({
        type: SecurityEventType.TRANSACTION_SUBMIT,
        timestamp: new Date().toISOString(),
        details: transactionDetails
      });

      // Perform security checks
      this.validateTransaction(transactionDetails);
      
      // Rate limiting check
      if (this.isRateLimited(transactionDetails.from)) {
        throw new PolkadotHubError(
          'Rate limit exceeded',
          ErrorCodes.SECURITY.RATE_LIMIT_EXCEEDED,
          'Too many transactions. Please try again later.'
        );
      }
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.TRANSACTION_FAILURE,
        timestamp: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          ...transactionDetails
        }
      });
      throw error;
    }
  }

  private validateTransaction(details: {
    type: string;
    from: string;
    to?: string;
    amount?: string;
  }): void {
    // Validate addresses
    if (!this.isValidAddress(details.from)) {
      throw new PolkadotHubError(
        'Invalid sender address',
        ErrorCodes.VALIDATION.INVALID_ADDRESS,
        'The sender address is not valid.'
      );
    }

    if (details.to && !this.isValidAddress(details.to)) {
      throw new PolkadotHubError(
        'Invalid recipient address',
        ErrorCodes.VALIDATION.INVALID_ADDRESS,
        'The recipient address is not valid.'
      );
    }

    // Validate amount if present
    if (details.amount && !this.isValidAmount(details.amount)) {
      throw new PolkadotHubError(
        'Invalid amount',
        ErrorCodes.VALIDATION.INVALID_AMOUNT,
        'The transaction amount is not valid.'
      );
    }
  }

  private isValidAddress(address: string): boolean {
    return /^(0x)?[0-9a-fA-F]{40,64}$/.test(address);
  }

  private isValidAmount(amount: string): boolean {
    return /^\d+(\.\d+)?$/.test(amount) && parseFloat(amount) > 0;
  }

  private isRateLimited(address: string): boolean {
    const now = Date.now();
    const lastRequest = this.metrics.lastRequestTime.get(address) || 0;
    const requestCount = this.metrics.requestCounts.get(address) || 0;

    if (now - lastRequest > this.config.rateLimitWindowMs) {
      // Reset counter for new window
      this.metrics.requestCounts.set(address, 1);
      this.metrics.lastRequestTime.set(address, now);
      return false;
    }

    if (requestCount >= this.config.maxRequestsPerWindow) {
      return true;
    }

    this.metrics.requestCounts.set(address, requestCount + 1);
    return false;
  }

  async recordFailedLogin(address: string): Promise<void> {
    const failedAttempts = (this.metrics.failedLogins.get(address) || 0) + 1;
    this.metrics.failedLogins.set(address, failedAttempts);
    this.metrics.lastFailedAttempt.set(address, Date.now());

    await securityLogger.logEvent({
      type: SecurityEventType.AUTH_FAILURE,
      timestamp: new Date().toISOString(),
      details: {
        address,
        failedAttempts
      }
    });

    if (failedAttempts >= this.config.maxFailedAttempts) {
      throw new PolkadotHubError(
        'Account locked',
        ErrorCodes.SECURITY.ACCOUNT_LOCKED,
        'Too many failed attempts. Please try again later.'
      );
    }
  }

  async clearFailedLogins(address: string): Promise<void> {
    this.metrics.failedLogins.delete(address);
    this.metrics.lastFailedAttempt.delete(address);
  }
}

export const securityAuditService = SecurityAuditService.getInstance(); 