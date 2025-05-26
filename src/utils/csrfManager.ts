import { randomBytes, createHmac } from 'crypto';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

class CsrfManager {
  private static instance: CsrfManager;
  private readonly secret: string;
  private readonly tokenExpiry = 3600000; // 1 hour

  private constructor() {
    const secret = process.env.CSRF_SECRET;
    if (!secret) {
      throw new Error('CSRF secret not configured');
    }
    this.secret = secret;
  }

  static getInstance(): CsrfManager {
    if (!CsrfManager.instance) {
      CsrfManager.instance = new CsrfManager();
    }
    return CsrfManager.instance;
  }

  generateToken(sessionId: string): string {
    const timestamp = Date.now();
    const nonce = randomBytes(16).toString('hex');
    const payload = `${sessionId}:${timestamp}:${nonce}`;
    
    const hmac = createHmac('sha256', this.secret);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return Buffer.from(`${payload}:${signature}`).toString('base64');
  }

  validateToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const parts = decoded.split(':');
      
      // Ensure we have all required parts
      if (parts.length !== 4) {
        return false;
      }

      const [storedSessionId, timestamp, nonce, signature] = parts;

      // Verify all parts are present
      if (!storedSessionId || !timestamp || !nonce || !signature) {
        return false;
      }

      // Verify session ID matches
      if (storedSessionId !== sessionId) {
        return false;
      }

      // Verify token age
      const timestampNum = parseInt(timestamp, 10);
      if (isNaN(timestampNum)) {
        return false;
      }

      const age = Date.now() - timestampNum;
      if (age > this.tokenExpiry) {
        return false;
      }

      // Verify signature
      const payload = `${sessionId}:${timestamp}:${nonce}`;
      const hmac = createHmac('sha256', this.secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  validateRequest(request: Request, sessionId: string): void {
    const token = request.headers.get('x-csrf-token');
    
    if (!token) {
      throw new PolkadotHubError(
        'Missing CSRF token',
        ErrorCodes.AUTH.MISSING_FIELDS,
        'CSRF token is required.'
      );
    }

    // At this point we know token is a string
    const csrfToken: string = token;

    if (!this.validateToken(csrfToken, sessionId)) {
      throw new PolkadotHubError(
        'Invalid CSRF token',
        ErrorCodes.AUTH.INVALID_TOKEN,
        'CSRF validation failed.'
      );
    }
  }
}

export const csrfManager = CsrfManager.getInstance(); 