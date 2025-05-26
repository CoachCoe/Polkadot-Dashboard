import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { signatureVerify } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';

interface AuthChallenge {
  message: string;
  timestamp: number;
}

class AuthService {
  private static instance: AuthService;

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
}

export const authService = AuthService.getInstance(); 