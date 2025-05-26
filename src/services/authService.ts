import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { signatureVerify } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';

interface AuthChallenge {
  message: string;
  timestamp: number;
}

class AuthService {
  private static instance: AuthService;
  private readonly SESSION_KEY = 'polkadot_dashboard_session';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async generateChallenge(address: string): Promise<AuthChallenge> {
    return {
      message: `Sign this message to authenticate with Polkadot Dashboard: ${address}`,
      timestamp: Date.now()
    };
  }

  async authenticate(address: string, signature: string, challenge: AuthChallenge): Promise<string> {
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

      // Create a simple session token
      const sessionToken = Buffer.from(`${address}:${Date.now()}`).toString('base64');

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.SESSION_KEY, sessionToken);
      }

      return sessionToken;
    } catch (error) {
      throw error;
    }
  }

  async verifySession(sessionToken?: string): Promise<boolean> {
    try {
      // If no token provided, try to get from localStorage
      if (!sessionToken && typeof window !== 'undefined') {
        sessionToken = localStorage.getItem(this.SESSION_KEY) || undefined;
      }

      if (!sessionToken) return false;

      const [address, timestamp] = Buffer.from(sessionToken, 'base64')
        .toString()
        .split(':');

      if (!address || !timestamp) return false;

      const tokenAge = Date.now() - parseInt(timestamp);
      const isValid = tokenAge <= 24 * 60 * 60 * 1000; // 24 hours

      // Clear invalid session from localStorage
      if (!isValid && typeof window !== 'undefined') {
        localStorage.removeItem(this.SESSION_KEY);
      }

      return isValid;
    } catch (error) {
      return false;
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }
}

export const authService = AuthService.getInstance(); 