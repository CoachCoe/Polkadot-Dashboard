export class PolkadotHubError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'PolkadotHubError';
  }
}

const SAFE_ERROR_MESSAGES = {
  'WALLET_NOT_FOUND': 'Wallet extension not found',
  'WALLET_ACCESS_DENIED': 'Wallet access denied',
  'INSUFFICIENT_BALANCE': 'Insufficient balance',
  'BRIDGE_UNAVAILABLE': 'Bridge unavailable',
  'INVALID_DESTINATION': 'Invalid destination address',
  'AMOUNT_TOO_LOW': 'Amount below minimum',
  'AMOUNT_TOO_HIGH': 'Amount above maximum',
  'NETWORK_ERROR': 'Network connection failed',
  'TRANSACTION_FAILED': 'Transaction failed',
  'RATE_LIMIT_EXCEEDED': 'Too many requests',
  'INVALID_ADDRESS': 'Invalid address format',
  'INVALID_AMOUNT': 'Invalid amount',
  'INVALID_CHAIN': 'Invalid chain selection',
  'UNKNOWN_ERROR': 'An unexpected error occurred'
};

function sanitizeErrorMessage(message: string): string {
  // Remove any potential sensitive information
  return message.replace(/([A-Za-z0-9+/]{32,})/g, '[REDACTED]')
               .replace(/(\d{1,3}\.){3}\d{1,3}/g, '[REDACTED_IP]')
               .replace(/0x[a-fA-F0-9]{40,}/g, '[REDACTED_ADDRESS]');
}

export function handleError(error: unknown): PolkadotHubError {
  if (error instanceof PolkadotHubError) {
    // Sanitize existing PolkadotHubError
    return new PolkadotHubError(
      sanitizeErrorMessage(error.message),
      error.code,
      error.code ? SAFE_ERROR_MESSAGES[error.code as keyof typeof SAFE_ERROR_MESSAGES] : undefined
    );
  }

  if (error instanceof Error) {
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    
    // Handle specific error types with safe messages
    if (sanitizedMessage.includes('Extension not found')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['WALLET_NOT_FOUND'],
        'WALLET_NOT_FOUND'
      );
    }
    
    if (sanitizedMessage.includes('Permission denied')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['WALLET_ACCESS_DENIED'],
        'WALLET_ACCESS_DENIED'
      );
    }

    if (sanitizedMessage.includes('Insufficient balance')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['INSUFFICIENT_BALANCE'],
        'INSUFFICIENT_BALANCE'
      );
    }

    // Bridge-specific errors
    if (sanitizedMessage.includes('Bridge not available')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['BRIDGE_UNAVAILABLE'],
        'BRIDGE_UNAVAILABLE'
      );
    }

    if (sanitizedMessage.includes('Invalid destination')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['INVALID_DESTINATION'],
        'INVALID_DESTINATION'
      );
    }

    if (sanitizedMessage.includes('Below minimum')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['AMOUNT_TOO_LOW'],
        'AMOUNT_TOO_LOW'
      );
    }

    if (sanitizedMessage.includes('Above maximum')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['AMOUNT_TOO_HIGH'],
        'AMOUNT_TOO_HIGH'
      );
    }

    if (sanitizedMessage.includes('Connection failed')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['NETWORK_ERROR'],
        'NETWORK_ERROR'
      );
    }

    if (sanitizedMessage.includes('Transaction failed')) {
      return new PolkadotHubError(
        SAFE_ERROR_MESSAGES['TRANSACTION_FAILED'],
        'TRANSACTION_FAILED'
      );
    }

    // Default case - return generic error
    return new PolkadotHubError(
      SAFE_ERROR_MESSAGES['UNKNOWN_ERROR'],
      'UNKNOWN_ERROR',
      'Please try again or contact support if the issue persists.'
    );
  }

  return new PolkadotHubError(
    SAFE_ERROR_MESSAGES['UNKNOWN_ERROR'],
    'UNKNOWN_ERROR'
  );
}

export function isPolkadotHubError(error: unknown): error is PolkadotHubError {
  return error instanceof PolkadotHubError;
}

export function isBridgeError(error: PolkadotHubError): boolean {
  const bridgeErrorCodes = [
    'BRIDGE_UNAVAILABLE',
    'INVALID_DESTINATION',
    'AMOUNT_TOO_LOW',
    'AMOUNT_TOO_HIGH',
    'NETWORK_ERROR',
    'TRANSACTION_FAILED'
  ];
  return error.code !== undefined && bridgeErrorCodes.includes(error.code);
} 