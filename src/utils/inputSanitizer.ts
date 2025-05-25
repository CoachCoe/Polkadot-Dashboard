import DOMPurify from 'isomorphic-dompurify';
import { PolkadotHubError } from './errorHandling';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripHTML?: boolean;
  maxLength?: number;
}

interface BridgeInput {
  fromChainId: string;
  toChainId: string;
  amount: string;
  recipient: string;
}

// SanitizedBridgeInput is the same as BridgeInput, no need for a separate type
// type SanitizedBridgeInput = BridgeInput;

class InputSanitizer {
  private static instance: InputSanitizer;
  private readonly MAX_STRING_LENGTH = 1000;
  private readonly MAX_AMOUNT_LENGTH = 50;
  private readonly MAX_ADDRESS_LENGTH = 100;
  private readonly MAX_CHAIN_ID_LENGTH = 20;

  private constructor() {}

  static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  sanitizeString(input: string, options: SanitizeOptions = {}): string {
    if (input === undefined || input === null) {
      throw new PolkadotHubError(
        'Invalid input',
        'INVALID_INPUT',
        'Input string cannot be null or undefined'
      );
    }

    const maxLength = options.maxLength || this.MAX_STRING_LENGTH;
    if (input.length > maxLength) {
      throw new PolkadotHubError(
        'Input too long',
        'INVALID_INPUT',
        `Input string exceeds maximum length of ${maxLength} characters`
      );
    }

    if (options.stripHTML) {
      // Remove all HTML tags
      return input.replace(/<[^>]*>/g, '').trim();
    }

    // Convert allowed attributes to array format expected by DOMPurify
    const allowedAttrs = options.allowedAttributes
      ? Object.values(options.allowedAttributes).flat()
      : [];

    // Use DOMPurify for HTML content with minimal configuration
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: options.allowedTags,
      ALLOWED_ATTR: allowedAttrs
    }).trim();
  }

  sanitizeObject<T extends object>(obj: T, options: SanitizeOptions = {}): T {
    if (!obj || typeof obj !== 'object') {
      throw new PolkadotHubError(
        'Invalid input',
        'INVALID_INPUT',
        'Input must be a valid object'
      );
    }

    try {
      const sanitized = { ...obj };

      Object.entries(sanitized).forEach(([key, value]) => {
        if (typeof value === 'string') {
          (sanitized as any)[key] = this.sanitizeString(value, options);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          (sanitized as any)[key] = this.sanitizeObject(value, options);
        } else if (Array.isArray(value)) {
          (sanitized as any)[key] = value.map(item =>
            typeof item === 'string'
              ? this.sanitizeString(item, options)
              : typeof item === 'object' && item !== null
              ? this.sanitizeObject(item, options)
              : item
          );
        }
      });

      return sanitized;
    } catch (error) {
      throw new PolkadotHubError(
        'Sanitization failed',
        'SANITIZATION_ERROR',
        'Failed to sanitize object',
        error as Error
      );
    }
  }

  sanitizeAddress(address: string): string {
    if (!address) {
      throw new PolkadotHubError(
        'Invalid address',
        'INVALID_INPUT',
        'Address cannot be empty'
      );
    }

    if (address.length > this.MAX_ADDRESS_LENGTH) {
      throw new PolkadotHubError(
        'Address too long',
        'INVALID_INPUT',
        `Address exceeds maximum length of ${this.MAX_ADDRESS_LENGTH} characters`
      );
    }

    // Remove any non-alphanumeric and non-special characters from addresses
    return address.replace(/[^a-zA-Z0-9-_]/g, '').trim();
  }

  sanitizeAmount(amount: string): string {
    if (!amount) {
      throw new PolkadotHubError(
        'Invalid amount',
        'INVALID_INPUT',
        'Amount cannot be empty'
      );
    }

    if (amount.length > this.MAX_AMOUNT_LENGTH) {
      throw new PolkadotHubError(
        'Amount too long',
        'INVALID_INPUT',
        `Amount exceeds maximum length of ${this.MAX_AMOUNT_LENGTH} characters`
      );
    }

    // Only allow numbers and decimal point
    const sanitized = amount.replace(/[^\d.]/g, '').trim();
    
    // Validate numeric format
    if (!/^\d*\.?\d*$/.test(sanitized) || sanitized.split('.').length > 2) {
      throw new PolkadotHubError(
        'Invalid amount format',
        'INVALID_INPUT',
        'Amount must be a valid number with at most one decimal point'
      );
    }

    return sanitized;
  }

  sanitizeChainId(chainId: string): string {
    if (!chainId) {
      throw new PolkadotHubError(
        'Invalid chain ID',
        'INVALID_INPUT',
        'Chain ID cannot be empty'
      );
    }

    if (chainId.length > this.MAX_CHAIN_ID_LENGTH) {
      throw new PolkadotHubError(
        'Chain ID too long',
        'INVALID_INPUT',
        `Chain ID exceeds maximum length of ${this.MAX_CHAIN_ID_LENGTH} characters`
      );
    }

    // Only allow alphanumeric characters and hyphens
    return chainId.replace(/[^a-zA-Z0-9-]/g, '').trim();
  }

  validateJSON(json: string): boolean {
    if (!json) {
      throw new PolkadotHubError(
        'Invalid JSON',
        'INVALID_INPUT',
        'JSON string cannot be empty'
      );
    }

    try {
      const parsed = JSON.parse(json);
      if (parsed === null || typeof parsed !== 'object') {
        throw new PolkadotHubError(
          'Invalid JSON',
          'INVALID_INPUT',
          'JSON must represent an object'
        );
      }
      return true;
    } catch (error) {
      if (error instanceof PolkadotHubError) {
        throw error;
      }
      throw new PolkadotHubError(
        'Invalid JSON',
        'INVALID_INPUT',
        'Failed to parse JSON string',
        error as Error
      );
    }
  }

  sanitizeBridgeInput(input: BridgeInput): BridgeInput {
    if (!input || typeof input !== 'object') {
      throw new PolkadotHubError(
        'Invalid bridge input',
        'INVALID_INPUT',
        'Bridge input must be a valid object'
      );
    }

    try {
      return {
        fromChainId: this.sanitizeChainId(input.fromChainId),
        toChainId: this.sanitizeChainId(input.toChainId),
        amount: this.sanitizeAmount(input.amount),
        recipient: this.sanitizeAddress(input.recipient)
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Bridge input sanitization failed',
        'SANITIZATION_ERROR',
        'Failed to sanitize bridge input',
        error as Error
      );
    }
  }
}

export const inputSanitizer = InputSanitizer.getInstance(); 