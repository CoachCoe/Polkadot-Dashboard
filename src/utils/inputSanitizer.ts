import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { DOMPurify } from 'isomorphic-dompurify';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripHTML?: boolean;
  maxLength?: number;
  allowedChars?: RegExp;
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
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
  private readonly ALLOWED_HTML_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'li'];
  private readonly ALLOWED_HTML_ATTRS = {
    'p': ['class'],
    'strong': ['class'],
    'em': ['class'],
    'ul': ['class'],
    'li': ['class']
  };
  private DOMPurify: DOMPurify | null = null;

  private constructor() {
    // Initialize DOMPurify in constructor to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('isomorphic-dompurify').then(({ default: createDOMPurify }) => {
        this.DOMPurify = createDOMPurify;
      }).catch(error => {
        console.warn('Failed to initialize DOMPurify:', error);
      });
    }
  }

  static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  async sanitizeString(input: string | number | boolean, options: SanitizeOptions = {}): Promise<string> {
    if (input === undefined || input === null) {
      throw new PolkadotHubError(
        'Invalid input',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Input cannot be null or undefined'
      );
    }

    // Convert to string if not already
    let sanitized = String(input).trim();

    const maxLength = options.maxLength || this.MAX_STRING_LENGTH;
    if (sanitized.length > maxLength) {
      throw new PolkadotHubError(
        'Input too long',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        `Input exceeds maximum length of ${maxLength} characters`
      );
    }

    if (options.stripHTML) {
      return sanitized.replace(/<[^>]*>/g, '').trim();
    }

    // Apply case transformations if specified
    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    } else if (options.toUpperCase) {
      sanitized = sanitized.toUpperCase();
    }

    // Apply character restrictions if specified
    if (options.allowedChars) {
      const filtered = sanitized.replace(options.allowedChars, '');
      if (filtered !== sanitized) {
        throw new PolkadotHubError(
          'Invalid characters',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'Input contains invalid characters'
        );
      }
    }

    // Use configured allowed tags and attributes or defaults
    const allowedTags = options.allowedTags || this.ALLOWED_HTML_TAGS;
    const allowedAttrs = options.allowedAttributes || this.ALLOWED_HTML_ATTRS;

    try {
      if (this.DOMPurify) {
        return this.DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: allowedTags,
          ALLOWED_ATTR: Object.values(allowedAttrs).flat(),
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
          RETURN_DOM: false,
          RETURN_DOM_FRAGMENT: false,
          WHOLE_DOCUMENT: false
        }).trim();
      }
    } catch (error) {
      console.warn('DOMPurify sanitization failed:', error);
    }

    // Fallback sanitization when DOMPurify is not available
    return sanitized.replace(/<(?!\/?(p|br|strong|em|ul|li)(?=>|\s.*>))\/?.*?>/g, '').trim();
  }

  async sanitizeObject<T extends object>(obj: T, options: SanitizeOptions = {}): Promise<T> {
    if (!obj || typeof obj !== 'object') {
      throw new PolkadotHubError(
        'Invalid input',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Input must be a valid object'
      );
    }

    try {
      const sanitized = { ...obj };

      for (const [key, value] of Object.entries(sanitized)) {
        if (value === null || value === undefined) {
          continue;
        }

        if (typeof value === 'string') {
          (sanitized as any)[key] = await this.sanitizeString(value, options);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          (sanitized as any)[key] = await this.sanitizeObject(value, options);
        } else if (Array.isArray(value)) {
          (sanitized as any)[key] = await Promise.all(
            value.map(async (item) => {
              if (item === null || item === undefined) return item;
              return typeof item === 'string'
                ? await this.sanitizeString(item, options)
                : typeof item === 'object'
                ? await this.sanitizeObject(item, options)
                : item;
            })
          );
        }
      }

      return sanitized;
    } catch (error) {
      throw new PolkadotHubError(
        'Sanitization failed',
        ErrorCodes.DATA.PARSE_ERROR,
        'Failed to sanitize object',
        error as Error
      );
    }
  }

  sanitizeAddress(address: string): string {
    if (!address) {
      throw new PolkadotHubError(
        'Invalid address',
        ErrorCodes.VALIDATION.INVALID_ADDRESS,
        'Address cannot be empty'
      );
    }

    address = String(address).trim();

    if (address.length > this.MAX_ADDRESS_LENGTH) {
      throw new PolkadotHubError(
        'Address too long',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        `Address exceeds maximum length of ${this.MAX_ADDRESS_LENGTH} characters`
      );
    }

    // Validate Polkadot address format (SS58)
    const ss58Regex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/;
    if (!ss58Regex.test(address)) {
      throw new PolkadotHubError(
        'Invalid address format',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Address must be a valid SS58 format'
      );
    }

    return address;
  }

  sanitizeAmount(amount: string): string {
    if (!amount) {
      throw new PolkadotHubError(
        'Invalid amount',
        ErrorCodes.VALIDATION.INVALID_AMOUNT,
        'Amount cannot be empty'
      );
    }

    amount = String(amount).trim();

    if (amount.length > this.MAX_AMOUNT_LENGTH) {
      throw new PolkadotHubError(
        'Amount too long',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        `Amount exceeds maximum length of ${this.MAX_AMOUNT_LENGTH} characters`
      );
    }

    // Only allow numbers and decimal point
    const sanitized = amount.replace(/[^\d.]/g, '');
    
    // Validate numeric format with proper decimal handling
    const parts = sanitized.split('.');
    if (!/^\d*\.?\d*$/.test(sanitized) || 
        parts.length > 2 || 
        (parts[1] && parts[1].length > 12)) {
      throw new PolkadotHubError(
        'Invalid amount format',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Amount must be a valid number with at most 12 decimal places'
      );
    }

    // Ensure the amount is greater than 0
    if (parseFloat(sanitized) <= 0) {
      throw new PolkadotHubError(
        'Invalid amount',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Amount must be greater than 0'
      );
    }

    return sanitized;
  }

  sanitizeChainId(chainId: string): string {
    if (!chainId) {
      throw new PolkadotHubError(
        'Invalid chain ID',
        ErrorCodes.VALIDATION.INVALID_CHAIN,
        'Chain ID cannot be empty'
      );
    }

    chainId = String(chainId).trim();

    if (chainId.length > this.MAX_CHAIN_ID_LENGTH) {
      throw new PolkadotHubError(
        'Chain ID too long',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        `Chain ID exceeds maximum length of ${this.MAX_CHAIN_ID_LENGTH} characters`
      );
    }

    // Only allow alphanumeric characters and hyphens
    const sanitized = chainId.replace(/[^a-zA-Z0-9-]/g, '');

    // Ensure chain ID follows expected format
    if (!/^[a-z0-9][-a-z0-9]*[a-z0-9]$/i.test(sanitized)) {
      throw new PolkadotHubError(
        'Invalid chain ID format',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Chain ID must start and end with alphanumeric characters'
      );
    }

    return sanitized;
  }

  validateJSON(json: string): boolean {
    if (!json) {
      throw new PolkadotHubError(
        'Invalid JSON',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'JSON string cannot be empty'
      );
    }

    try {
      const parsed = JSON.parse(json);
      if (parsed === null || typeof parsed !== 'object') {
        throw new PolkadotHubError(
          'Invalid JSON',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'JSON must represent an object'
        );
      }
      return true;
    } catch (error) {
      throw new PolkadotHubError(
        'Invalid JSON format',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Failed to parse JSON string',
        error as Error
      );
    }
  }

  async sanitizeBridgeInput(input: BridgeInput): Promise<BridgeInput> {
    if (!input || typeof input !== 'object') {
      throw new PolkadotHubError(
        'Invalid bridge input',
        ErrorCodes.VALIDATION.INVALID_PARAMETER,
        'Bridge input must be a valid object'
      );
    }

    return {
      fromChainId: this.sanitizeChainId(input.fromChainId),
      toChainId: this.sanitizeChainId(input.toChainId),
      amount: this.sanitizeAmount(input.amount),
      recipient: this.sanitizeAddress(input.recipient)
    };
  }
}

export const inputSanitizer = InputSanitizer.getInstance(); 