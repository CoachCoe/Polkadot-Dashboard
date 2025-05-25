// Error code categories
export const ErrorCodes = {
  // Wallet errors
  WALLET: {
    NOT_FOUND: 'WALLET_NOT_FOUND',
    ACCESS_DENIED: 'WALLET_ACCESS_DENIED',
    NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
    CONNECTION_ERROR: 'WALLET_CONNECTION_ERROR',
    DISCONNECTED: 'WALLET_DISCONNECTED',
    ACCOUNT_NOT_FOUND: 'WALLET_ACCOUNT_NOT_FOUND',
    SIGNATURE_FAILED: 'WALLET_SIGNATURE_FAILED',
    NO_ACCOUNTS: 'NO_ACCOUNTS',
    NO_SIGNER: 'NO_SIGNER',
    SIGNER_ERROR: 'SIGNER_ERROR',
    EXTENSION_LOAD_ERROR: 'EXTENSION_LOAD_ERROR',
    EXTENSION_NOT_AVAILABLE: 'EXTENSION_NOT_AVAILABLE'
  },

  // Environment errors
  ENV: {
    ERROR: 'ENVIRONMENT_ERROR',
    SERVER_ERROR: 'SERVER_ERROR'
  },

  // Transaction errors
  TX: {
    FAILED: 'TRANSACTION_FAILED',
    REJECTED: 'TRANSACTION_REJECTED',
    TIMEOUT: 'TRANSACTION_TIMEOUT',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    SUCCESS: 'TRANSACTION_SUCCESS'
  },

  // Bridge errors
  BRIDGE: {
    UNAVAILABLE: 'BRIDGE_UNAVAILABLE',
    ERROR: 'BRIDGE_ERROR',
    INVALID_DESTINATION: 'INVALID_DESTINATION',
    AMOUNT_TOO_LOW: 'AMOUNT_TOO_LOW',
    AMOUNT_TOO_HIGH: 'AMOUNT_TOO_HIGH',
    ESTIMATE_ERROR: 'ESTIMATE_ERROR'
  },

  // Network errors
  NETWORK: {
    ERROR: 'NETWORK_ERROR',
    API_ERROR: 'API_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
  },

  // Data errors
  DATA: {
    INVALID: 'INVALID_DATA',
    NOT_FOUND: 'DATA_NOT_FOUND',
    PARSE_ERROR: 'PARSE_ERROR',
    PROJECT_STATS_ERROR: 'PROJECT_STATS_ERROR',
    PROJECT_FILTER_ERROR: 'PROJECT_FILTER_ERROR',
    ECOSYSTEM_LOAD_ERROR: 'ECOSYSTEM_LOAD_ERROR',
    PROJECT_FETCH_ERROR: 'PROJECT_FETCH_ERROR',
    STAKING_ERROR: 'STAKING_ERROR'
  },

  // Validation errors
  VALIDATION: {
    INVALID_ADDRESS: 'INVALID_ADDRESS',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_CHAIN: 'INVALID_CHAIN',
    INVALID_PARAMETER: 'INVALID_PARAMETER',
    INVALID_STATE: 'INVALID_STATE',
    INVALID_INFO: 'INVALID_INFO',
    INVALID_INDEX: 'INVALID_INDEX',
    INVALID_TARGET: 'INVALID_TARGET',
    INVALID_TRACK: 'INVALID_TRACK',
    INVALID_CONVICTION: 'INVALID_CONVICTION',
    INVALID_PREIMAGE: 'INVALID_PREIMAGE',
    INVALID_ID: 'INVALID_ID',
    INVALID_RECIPIENT: 'INVALID_RECIPIENT'
  },

  // Authentication errors
  AUTH: {
    NO_SESSION: 'AUTH_NO_SESSION',
    INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
    EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN',
    INVALID_SIGNATURE: 'AUTH_INVALID_SIGNATURE',
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    MISSING_FIELDS: 'AUTH_MISSING_FIELDS',
    MISSING_ADDRESS: 'AUTH_MISSING_ADDRESS',
    CHALLENGE_NOT_FOUND: 'AUTH_CHALLENGE_NOT_FOUND',
    CHALLENGE_EXPIRED: 'AUTH_CHALLENGE_EXPIRED',
    VERIFICATION_FAILED: 'AUTH_VERIFICATION_FAILED',
    SESSION_CREATION_FAILED: 'AUTH_SESSION_CREATION_FAILED'
  },

  // Success messages
  SUCCESS: {
    VOTE: 'VOTE_SUCCESS',
    DELEGATE: 'DELEGATE_SUCCESS',
    UNDELEGATE: 'UNDELEGATE_SUCCESS',
    CONNECTION: 'CONNECTION_SUCCESS'
  },

  // Generic errors
  GENERIC: {
    UNKNOWN: 'UNKNOWN_ERROR',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
    NOT_SUPPORTED: 'NOT_SUPPORTED',
    NOT_AUTHORIZED: 'NOT_AUTHORIZED',
    NOT_FOUND: 'NOT_FOUND'
  }
} as const;

// Create a type that includes all possible error codes
type ErrorCodeValues<T> = T extends { [key: string]: infer U }
  ? U extends string
    ? U
    : U extends { [key: string]: string }
    ? ErrorCodeValues<U>
    : never
  : never;

export type ErrorCode = ErrorCodeValues<typeof ErrorCodes>;

const SAFE_ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Wallet errors
  'WALLET_NOT_FOUND': 'Wallet extension not found',
  'WALLET_ACCESS_DENIED': 'Wallet access denied',
  'WALLET_NOT_CONNECTED': 'Wallet not connected',
  'WALLET_CONNECTION_ERROR': 'Failed to connect wallet',
  'WALLET_DISCONNECTED': 'Wallet disconnected',
  'WALLET_ACCOUNT_NOT_FOUND': 'No account found in wallet',
  'WALLET_SIGNATURE_FAILED': 'Failed to sign message',
  'NO_ACCOUNTS': 'No accounts found',
  'NO_SIGNER': 'No signer available',
  'SIGNER_ERROR': 'Failed to get signer',
  'EXTENSION_LOAD_ERROR': 'Failed to load wallet extension',
  'EXTENSION_NOT_AVAILABLE': 'Wallet extension not available',

  // Environment errors
  'ENVIRONMENT_ERROR': 'Environment error',
  'SERVER_ERROR': 'Server error',

  // Transaction errors
  'TRANSACTION_FAILED': 'Transaction failed',
  'TRANSACTION_REJECTED': 'Transaction rejected by user',
  'TRANSACTION_TIMEOUT': 'Transaction timed out',
  'INSUFFICIENT_BALANCE': 'Insufficient balance',
  'TRANSACTION_SUCCESS': 'Transaction successful',

  // Bridge errors
  'BRIDGE_UNAVAILABLE': 'Bridge unavailable',
  'BRIDGE_ERROR': 'Bridge operation failed',
  'INVALID_DESTINATION': 'Invalid destination address',
  'AMOUNT_TOO_LOW': 'Amount below minimum',
  'AMOUNT_TOO_HIGH': 'Amount above maximum',
  'ESTIMATE_ERROR': 'Failed to estimate transfer fees',

  // Network errors
  'NETWORK_ERROR': 'Network connection failed',
  'API_ERROR': 'API request failed',
  'RATE_LIMIT_EXCEEDED': 'Too many requests',

  // Data errors
  'INVALID_DATA': 'Invalid data received',
  'DATA_NOT_FOUND': 'Data not found',
  'PARSE_ERROR': 'Failed to parse data',
  'PROJECT_STATS_ERROR': 'Failed to fetch project statistics',
  'PROJECT_FILTER_ERROR': 'Failed to apply project filters',
  'ECOSYSTEM_LOAD_ERROR': 'Failed to load ecosystem data',
  'PROJECT_FETCH_ERROR': 'Failed to fetch project data',
  'STAKING_ERROR': 'Failed to load staking information',

  // Validation errors
  'INVALID_ADDRESS': 'Invalid address format',
  'INVALID_AMOUNT': 'Invalid amount',
  'INVALID_CHAIN': 'Invalid chain selection',
  'INVALID_PARAMETER': 'Invalid parameter',
  'INVALID_STATE': 'Invalid state',
  'INVALID_INFO': 'Invalid information',
  'INVALID_INDEX': 'Invalid index',
  'INVALID_TARGET': 'Invalid target',
  'INVALID_TRACK': 'Invalid track',
  'INVALID_CONVICTION': 'Invalid conviction',
  'INVALID_PREIMAGE': 'Invalid preimage',
  'INVALID_ID': 'Invalid ID',
  'INVALID_RECIPIENT': 'Invalid recipient',

  // Success messages
  'VOTE_SUCCESS': 'Vote submitted successfully',
  'DELEGATE_SUCCESS': 'Delegation successful',
  'UNDELEGATE_SUCCESS': 'Successfully undelegated',
  'CONNECTION_SUCCESS': 'Successfully connected',

  // Generic errors
  'UNKNOWN_ERROR': 'An unexpected error occurred',
  'NOT_IMPLEMENTED': 'Feature not implemented',
  'NOT_SUPPORTED': 'Operation not supported',
  'NOT_AUTHORIZED': 'Not authorized',
  'NOT_FOUND': 'Resource not found',

  // Authentication errors
  'AUTH_NO_SESSION': 'No active session found',
  'AUTH_INVALID_TOKEN': 'Invalid authentication token',
  'AUTH_EXPIRED_TOKEN': 'Authentication token has expired',
  'AUTH_INVALID_SIGNATURE': 'Invalid signature',
  'AUTH_UNAUTHORIZED': 'Unauthorized access',
  'AUTH_SESSION_EXPIRED': 'Session has expired',
  'AUTH_MISSING_FIELDS': 'Missing required authentication fields',
  'AUTH_MISSING_ADDRESS': 'Missing wallet address',
  'AUTH_CHALLENGE_NOT_FOUND': 'Authentication challenge not found',
  'AUTH_CHALLENGE_EXPIRED': 'Authentication challenge has expired',
  'AUTH_VERIFICATION_FAILED': 'Failed to verify authentication',
  'AUTH_SESSION_CREATION_FAILED': 'Failed to create session'
};

export class PolkadotHubError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly details: string | undefined;
  readonly originalError: unknown | undefined;

  constructor(
    message: string,
    code: ErrorCode,
    details?: string,
    originalError?: unknown,
    userMessage?: string
  ) {
    super(message);
    this.name = 'PolkadotHubError';
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    this.userMessage = userMessage ?? details ?? SAFE_ERROR_MESSAGES[code] ?? message;

    // Capture stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PolkadotHubError);
    }
  }

  static fromCode(code: ErrorCode, details?: string, originalError?: unknown): PolkadotHubError {
    return new PolkadotHubError(
      SAFE_ERROR_MESSAGES[code],
      code,
      details,
      originalError
    );
  }

  static fromError(error: unknown, defaultCode: ErrorCode = ErrorCodes.GENERIC.UNKNOWN): PolkadotHubError {
    if (error instanceof PolkadotHubError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new PolkadotHubError(
      message,
      defaultCode,
      'An unexpected error occurred. Please try again.',
      error
    );
  }
}

function sanitizeErrorMessage(message: string): string {
  // Remove any potential sensitive information
  return message.replace(/([A-Za-z0-9+/]{32,})/g, '[REDACTED]')
               .replace(/(\d{1,3}\.){3}\d{1,3}/g, '[REDACTED_IP]')
               .replace(/0x[a-fA-F0-9]{40,}/g, '[REDACTED_ADDRESS]');
}

export function handleError(error: unknown): PolkadotHubError {
  if (error instanceof PolkadotHubError) {
    return error;
  }

  if (error instanceof Error) {
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    
    // Handle specific error types with safe messages
    if (sanitizedMessage.includes('Extension not found')) {
      return PolkadotHubError.fromCode(ErrorCodes.WALLET.NOT_FOUND, undefined, error);
    }
    
    if (sanitizedMessage.includes('Permission denied')) {
      return PolkadotHubError.fromCode(ErrorCodes.WALLET.ACCESS_DENIED, undefined, error);
    }

    if (sanitizedMessage.includes('Insufficient balance')) {
      return PolkadotHubError.fromCode(ErrorCodes.TX.INSUFFICIENT_BALANCE, undefined, error);
    }

    if (sanitizedMessage.includes('Bridge not available')) {
      return PolkadotHubError.fromCode(ErrorCodes.BRIDGE.UNAVAILABLE, undefined, error);
    }

    if (sanitizedMessage.includes('Invalid destination')) {
      return PolkadotHubError.fromCode(ErrorCodes.BRIDGE.INVALID_DESTINATION, undefined, error);
    }

    if (sanitizedMessage.includes('Below minimum')) {
      return PolkadotHubError.fromCode(ErrorCodes.BRIDGE.AMOUNT_TOO_LOW, undefined, error);
    }

    if (sanitizedMessage.includes('Above maximum')) {
      return PolkadotHubError.fromCode(ErrorCodes.BRIDGE.AMOUNT_TOO_HIGH, undefined, error);
    }

    if (sanitizedMessage.includes('Connection failed')) {
      return PolkadotHubError.fromCode(ErrorCodes.NETWORK.ERROR, undefined, error);
    }

    if (sanitizedMessage.includes('Transaction failed')) {
      return PolkadotHubError.fromCode(ErrorCodes.TX.FAILED, undefined, error);
    }

    // Default case - return generic error
    return PolkadotHubError.fromCode(
      ErrorCodes.GENERIC.UNKNOWN,
      'Please try again or contact support if the issue persists.',
      error
    );
  }

  return PolkadotHubError.fromCode(
    ErrorCodes.GENERIC.UNKNOWN,
    'An unexpected error occurred',
    error
  );
}

export function isPolkadotHubError(error: unknown): error is PolkadotHubError {
  return error instanceof PolkadotHubError;
}

export function isBridgeError(error: PolkadotHubError): boolean {
  const bridgeErrorCodes = [
    ErrorCodes.BRIDGE.UNAVAILABLE,
    ErrorCodes.BRIDGE.ERROR,
    ErrorCodes.BRIDGE.INVALID_DESTINATION,
    ErrorCodes.BRIDGE.AMOUNT_TOO_LOW,
    ErrorCodes.BRIDGE.AMOUNT_TOO_HIGH
  ];
  return bridgeErrorCodes.includes(error.code as any);
} 