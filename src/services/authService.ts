import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { sessionManager } from '@/utils/sessionManager';
import { PolkadotHubError } from '@/utils/errorHandling';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

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

  async generateChallenge(address: string): Promise<AuthChallenge> {
    await cryptoWaitReady();
    
    const timestamp = Date.now();
    const nonce = this.generateNonce();
    const message = `Sign this message to authenticate with Polkadot Dashboard\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    const challenge: AuthChallenge = {
      message,
      timestamp,
      expiresAt: timestamp + this.CHALLENGE_DURATION
    };

    this.challenges.set(address, challenge);

    await securityLogger.logEvent({
      type: SecurityEventType.AUTH_ATTEMPT,
      timestamp: new Date().toISOString(),
      details: {
        action: 'challenge_generated',
        address
      }
    });

    return challenge;
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
      const { signatureVerify } = await import('@polkadot/util-crypto');
      const { hexToU8a } = await import('@polkadot/util');

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
}

export const authService = AuthService.getInstance(); 