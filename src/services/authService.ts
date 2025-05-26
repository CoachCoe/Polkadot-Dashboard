import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { sessionManager } from '@/utils/sessionManager';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { signatureVerify } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';

interface AuthChallenge {
  message: string;
  timestamp: number;
  expiresAt: number;
}

class AuthService {
  private static instance: AuthService;
  private challenges: Map<string, AuthChallenge> = new Map();
  private readonly CHALLENGE_DURATION = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return u8aToHex(array);
  }

  async generateChallenge(address: string): Promise<{ message: string; timestamp: number }> {
    return {
      message: `Sign this message to authenticate with Polkadot Dashboard: ${address}`,
      timestamp: Date.now()
    };
  }

  async verifySignature(address: string, signature: string): Promise<boolean> {
    try {
      const challenge = this.challenges.get(address);

      if (!challenge) {
        throw new PolkadotHubError(
          'Authentication challenge not found',
          'AUTH_CHALLENGE_NOT_FOUND'
        );
      }

      if (challenge.expiresAt < Date.now()) {
        this.challenges.delete(address);
        throw new PolkadotHubError(
          'Authentication challenge expired',
          'AUTH_CHALLENGE_EXPIRED'
        );
      }

      // Verify the signature using Polkadot.js
      const { isValid } = signatureVerify(
        challenge.message,
        hexToU8a(signature),
        address
      );

      if (!isValid) {
        throw new PolkadotHubError(
          'Invalid signature',
          'AUTH_INVALID_SIGNATURE'
        );
      }

      // Clean up the used challenge
      this.challenges.delete(address);

      await securityLogger.logEvent({
        type: SecurityEventType.AUTH_ATTEMPT,
        timestamp: new Date().toISOString(),
        details: {
          action: 'signature_verified',
          address
        }
      });

      return true;
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.AUTH_ATTEMPT,
        timestamp: new Date().toISOString(),
        details: {
          action: 'signature_verification_failed',
          error: String(error)
        }
      });

      if (error instanceof PolkadotHubError) {
        throw error;
      }

      throw new PolkadotHubError(
        'Failed to verify signature',
        'AUTH_VERIFICATION_FAILED',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async createSession(address: string, ip: string, userAgent: string): Promise<string> {
    try {
      const session = await sessionManager.createSession(address, ip, userAgent);

      await securityLogger.logEvent({
        type: SecurityEventType.AUTH_ATTEMPT,
        timestamp: new Date().toISOString(),
        ip,
        userId: address,
        details: {
          action: 'session_created',
          userAgent
        }
      });

      return session.id;
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.AUTH_ATTEMPT,
        timestamp: new Date().toISOString(),
        ip,
        userId: address,
        details: {
          action: 'session_creation_failed',
          error: String(error)
        }
      });

      throw new PolkadotHubError(
        'Failed to create session',
        'AUTH_SESSION_CREATION_FAILED',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async validateSession(sessionId: string, ip: string): Promise<boolean> {
    try {
      const session = await sessionManager.validateSession(sessionId, ip);
      return !!session;
    } catch {
      return false;
    }
  }

  async logout(sessionId: string): Promise<void> {
    await sessionManager.destroySession(sessionId);
    
    await securityLogger.logEvent({
      type: SecurityEventType.AUTH_ATTEMPT,
      timestamp: new Date().toISOString(),
      details: {
        action: 'session_destroyed',
        sessionId
      }
    });
  }

  async authenticate(address: string, signature: string, challenge: { message: string; timestamp: number }): Promise<string> {
    try {
      if (!address || !signature || !challenge?.message) {
        throw new PolkadotHubError(
          'Missing required fields',
          ErrorCodes.AUTH.MISSING_FIELDS,
          'All authentication fields are required.'
        );
      }

      // Verify the signature using Polkadot.js util-crypto
      const { isValid } = signatureVerify(
        challenge.message,
        hexToU8a(signature),
        address
      );

      if (!isValid) {
        throw new PolkadotHubError(
          'Invalid signature',
          ErrorCodes.AUTH.INVALID_SIGNATURE,
          'The provided signature is not valid.'
        );
      }

      // For static export, we'll use a simple session token
      return Buffer.from(`${address}:${Date.now()}`).toString('base64');
    } catch (error) {
      throw error;
    }
  }

  async verifySession(sessionToken: string): Promise<boolean> {
    try {
      if (!sessionToken) return false;

      const [address, timestamp] = Buffer.from(sessionToken, 'base64')
        .toString()
        .split(':');

      if (!address || !timestamp) return false;

      const tokenAge = Date.now() - parseInt(timestamp);
      return tokenAge <= 24 * 60 * 60 * 1000; // 24 hours
    } catch (error) {
      return false;
    }
  }

  async verifyChallenge(challengeId: string): Promise<string> {
    try {
      const challenge = await this.getChallenge(challengeId);
      
      if (!challenge) {
        throw new PolkadotHubError(
          'Challenge not found',
          ErrorCodes.AUTH.CHALLENGE_NOT_FOUND,
          'The authentication challenge was not found.'
        );
      }

      if (Date.now() - challenge.timestamp > 5 * 60 * 1000) { // 5 minutes
        throw new PolkadotHubError(
          'Challenge expired',
          ErrorCodes.AUTH.CHALLENGE_EXPIRED,
          'The authentication challenge has expired. Please request a new one.'
        );
      }

      return challenge.message;
    } catch (error) {
      throw error;
    }
  }

  private async getChallenge(challengeId: string): Promise<{ message: string; timestamp: number } | null> {
    // In a real app, you'd get this from a database or cache
    // This is just a mock implementation
    return {
      message: 'Sign this message to authenticate: ' + challengeId,
      timestamp: Date.now() - 60 * 1000 // 1 minute ago
    };
  }
}

export const authService = AuthService.getInstance(); 