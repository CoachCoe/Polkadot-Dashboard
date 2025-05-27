import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

interface EncryptedData {
  data: string;
  iv: string;
}

class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;
  private isServer: boolean;

  private constructor() {
    this.isServer = typeof window === 'undefined';
    const key = this.isServer ? process.env.ENCRYPTION_KEY : process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
    
    if (!key) {
      throw new PolkadotHubError(
        'Missing encryption key',
        ErrorCodes.ENV.ERROR,
        'Encryption key not configured'
      );
    }
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async encrypt(data: string | object): Promise<EncryptedData> {
    try {
      // If on client side and data is sensitive, use Web Crypto API
      if (!this.isServer && this.isSensitiveData(data)) {
        return this.encryptWithWebCrypto(data);
      }

      const iv = randomBytes(12);
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
      
      const encrypted = Buffer.concat([
        cipher.update(jsonData, 'utf8'),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      // Combine the encrypted data with the auth tag
      const combined = Buffer.concat([
        authTag,
        encrypted
      ]);

      return {
        data: combined.toString('base64'),
        iv: iv.toString('base64')
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Encryption failed',
        ErrorCodes.SECURITY.ENCRYPTION_FAILED,
        'Failed to encrypt data'
      );
    }
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    try {
      // If on client side, try Web Crypto API first
      if (!this.isServer) {
        try {
          return await this.decryptWithWebCrypto(encryptedData);
        } catch (error) {
          // Fall back to Node crypto if Web Crypto fails
          console.warn('Web Crypto decryption failed, falling back to Node crypto');
        }
      }

      const iv = Buffer.from(encryptedData.iv, 'base64');
      const combined = Buffer.from(encryptedData.data, 'base64');
      
      // Split the auth tag and encrypted data
      const authTag = combined.subarray(0, 16);
      const encrypted = combined.subarray(16);

      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new PolkadotHubError(
        'Decryption failed',
        ErrorCodes.SECURITY.DECRYPTION_FAILED,
        'Failed to decrypt data'
      );
    }
  }

  private async encryptWithWebCrypto(data: string | object): Promise<EncryptedData> {
    const crypto = window.crypto;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.importWebCryptoKey();

    const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
    const encodedData = new TextEncoder().encode(jsonData);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encodedData
    );

    return {
      data: Buffer.from(encrypted).toString('base64'),
      iv: Buffer.from(iv).toString('base64')
    };
  }

  private async decryptWithWebCrypto(encryptedData: EncryptedData): Promise<string> {
    const crypto = window.crypto;
    const key = await this.importWebCryptoKey();
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const data = Buffer.from(encryptedData.data, 'base64');

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  private async importWebCryptoKey(): Promise<CryptoKey> {
    const crypto = window.crypto;
    return crypto.subtle.importKey(
      'raw',
      this.encryptionKey,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
  }

  private isSensitiveData(data: string | object): boolean {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    // Check if data contains sensitive information patterns
    const sensitivePatterns = [
      /private/i,
      /secret/i,
      /key/i,
      /password/i,
      /wallet/i,
      /balance/i,
      /0x[a-fA-F0-9]{40}/  // Ethereum-style addresses
    ];
    return sensitivePatterns.some(pattern => pattern.test(stringData));
  }

  async encryptSensitiveData(data: {
    walletAddress?: string;
    privateData?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      // Add timestamp for preventing replay attacks
      const dataWithTimestamp = {
        ...data,
        timestamp: Date.now()
      };

      const encrypted = await this.encrypt(dataWithTimestamp);
      return JSON.stringify(encrypted);
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to encrypt sensitive data',
        ErrorCodes.SECURITY.ENCRYPTION_FAILED,
        'Could not secure sensitive information'
      );
    }
  }

  async decryptSensitiveData(encryptedString: string): Promise<any> {
    try {
      const encrypted: EncryptedData = JSON.parse(encryptedString);
      const decrypted = await this.decrypt(encrypted);
      const data = JSON.parse(decrypted);

      // Check if data is expired (24 hours)
      const age = Date.now() - data.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        throw new PolkadotHubError(
          'Data expired',
          ErrorCodes.SECURITY.DATA_EXPIRED,
          'The encrypted data has expired'
        );
      }

      return data;
    } catch (error) {
      if (error instanceof PolkadotHubError) {
        throw error;
      }
      throw new PolkadotHubError(
        'Failed to decrypt sensitive data',
        ErrorCodes.SECURITY.DECRYPTION_FAILED,
        'Could not access secured information'
      );
    }
  }
}

export const encryptionService = EncryptionService.getInstance(); 