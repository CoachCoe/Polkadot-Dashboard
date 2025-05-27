// Error code categories
export const ErrorCodes = {
  // Wallet errors
  WALLET: {
    NOT_FOUND: 'WALLET_NOT_FOUND' as const,
    ACCESS_DENIED: 'WALLET_ACCESS_DENIED' as const,
    NOT_CONNECTED: 'WALLET_NOT_CONNECTED' as const,
    CONNECTION_ERROR: 'WALLET_CONNECTION_ERROR' as const,
    NO_ACCOUNTS: 'WALLET_NO_ACCOUNTS' as const,
    NO_SIGNER: 'WALLET_NO_SIGNER' as const,
    SIGNER_ERROR: 'WALLET_SIGNER_ERROR' as const,
    DISCONNECTED: 'WALLET_DISCONNECTED' as const,
    EXTENSION_LOAD_ERROR: 'WALLET_EXTENSION_LOAD_ERROR' as const,
    EXTENSION_NOT_AVAILABLE: 'WALLET_EXTENSION_NOT_AVAILABLE' as const,
    STATE_ERROR: 'WALLET_STATE_ERROR' as const,
    ACCOUNT_NOT_FOUND: 'WALLET_ACCOUNT_NOT_FOUND' as const,
    SIGNATURE_FAILED: 'WALLET_SIGNATURE_FAILED' as const,
    REJECTED: 'WALLET_REJECTED' as const,
    EXTENSION_NOT_FOUND: 'WALLET_EXTENSION_NOT_FOUND' as const,
    INVALID_ADDRESS: 'WALLET_INVALID_ADDRESS' as const,
    TRANSACTION_FAILED: 'WALLET_TRANSACTION_FAILED' as const,
    INSUFFICIENT_BALANCE: 'WALLET_INSUFFICIENT_BALANCE' as const,
    NETWORK_ERROR: 'WALLET_NETWORK_ERROR' as const,
    TIMEOUT: 'WALLET_TIMEOUT' as const,
    USER_REJECTED: 'WALLET_USER_REJECTED' as const,
    UNSUPPORTED_CHAIN: 'WALLET_UNSUPPORTED_CHAIN' as const,
    WRONG_NETWORK: 'WALLET_WRONG_NETWORK' as const
  },

  // Environment errors
  ENV: {
    ERROR: 'ENVIRONMENT_ERROR' as const,
    SERVER_ERROR: 'SERVER_ERROR' as const
  },

  // Transaction errors
  TX: {
    FAILED: 'TRANSACTION_FAILED' as const,
    REJECTED: 'TRANSACTION_REJECTED' as const,
    TIMEOUT: 'TRANSACTION_TIMEOUT' as const,
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE' as const,
    SUCCESS: 'TRANSACTION_SUCCESS' as const
  },

  // Bridge errors
  BRIDGE: {
    UNAVAILABLE: 'BRIDGE_UNAVAILABLE' as const,
    ERROR: 'BRIDGE_ERROR' as const,
    INVALID_DESTINATION: 'INVALID_DESTINATION' as const,
    AMOUNT_TOO_LOW: 'AMOUNT_TOO_LOW' as const,
    AMOUNT_TOO_HIGH: 'AMOUNT_TOO_HIGH' as const,
    ESTIMATE_ERROR: 'BRIDGE_ESTIMATE_ERROR' as const,
    TRANSFER_ERROR: 'BRIDGE_TRANSFER_ERROR' as const,
    QUOTE_ERROR: 'BRIDGE_QUOTE_ERROR' as const,
    TRANSFER_FAILED: 'BRIDGE_TRANSFER_FAILED' as const,
    INSUFFICIENT_BALANCE: 'BRIDGE_INSUFFICIENT_BALANCE' as const,
    UNSUPPORTED_TOKEN: 'BRIDGE_UNSUPPORTED_TOKEN' as const
  },

  // Network errors
  NETWORK: {
    ERROR: 'NETWORK_ERROR' as const,
    CONNECTION_ERROR: 'NETWORK_CONNECTION_ERROR' as const,
    TIMEOUT: 'NETWORK_TIMEOUT' as const,
    API_ERROR: 'NETWORK_API_ERROR' as const
  },

  // Data errors
  DATA: {
    INVALID: 'INVALID_DATA' as const,
    NOT_FOUND: 'DATA_NOT_FOUND' as const,
    PARSE_ERROR: 'PARSE_ERROR' as const,
    PROJECT_STATS_ERROR: 'PROJECT_STATS_ERROR' as const,
    PROJECT_FILTER_ERROR: 'PROJECT_FILTER_ERROR' as const,
    ECOSYSTEM_LOAD_ERROR: 'ECOSYSTEM_LOAD_ERROR' as const,
    PROJECT_FETCH_ERROR: 'PROJECT_FETCH_ERROR' as const,
    STAKING_ERROR: 'STAKING_ERROR' as const,
    INVALID_FORMAT: 'INVALID_FORMAT' as const,
    STALE: 'DATA_STALE' as const,
    CATEGORY_ERROR: 'CATEGORY_ERROR' as const,
    BALANCE_ERROR: 'BALANCE_ERROR' as const,
    TRANSACTION_ERROR: 'TRANSACTION_ERROR' as const
  },

  // Validation errors
  VALIDATION: {
    INVALID_ADDRESS: 'INVALID_ADDRESS' as const,
    INVALID_AMOUNT: 'INVALID_AMOUNT' as const,
    INVALID_CHAIN: 'INVALID_CHAIN' as const,
    INVALID_PARAMETER: 'VALIDATION_INVALID_PARAMETER' as const,
    INVALID_STATE: 'INVALID_STATE' as const,
    INVALID_INFO: 'INVALID_INFO' as const,
    INVALID_INDEX: 'INVALID_INDEX' as const,
    INVALID_TARGET: 'INVALID_TARGET' as const,
    INVALID_TRACK: 'INVALID_TRACK' as const,
    INVALID_CONVICTION: 'INVALID_CONVICTION' as const,
    INVALID_PREIMAGE: 'INVALID_PREIMAGE' as const,
    INVALID_ID: 'INVALID_ID' as const,
    INVALID_RECIPIENT: 'INVALID_RECIPIENT' as const,
    MISSING_PARAMETER: 'VALIDATION_MISSING_PARAMETER' as const
  },

  // Authentication errors
  AUTH: {
    NO_SESSION: 'AUTH_NO_SESSION' as const,
    INVALID_TOKEN: 'AUTH_INVALID_TOKEN' as const,
    EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN' as const,
    INVALID_SIGNATURE: 'AUTH_INVALID_SIGNATURE' as const,
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED' as const,
    SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED' as const,
    MISSING_FIELDS: 'AUTH_MISSING_FIELDS' as const,
    MISSING_ADDRESS: 'AUTH_MISSING_ADDRESS' as const,
    CHALLENGE_NOT_FOUND: 'AUTH_CHALLENGE_NOT_FOUND' as const,
    CHALLENGE_EXPIRED: 'AUTH_CHALLENGE_EXPIRED' as const,
    VERIFICATION_FAILED: 'AUTH_VERIFICATION_FAILED' as const,
    SESSION_CREATION_FAILED: 'AUTH_SESSION_CREATION_FAILED' as const,
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED' as const
  },

  // Success messages
  SUCCESS: {
    VOTE: 'VOTE_SUCCESS' as const,
    DELEGATE: 'DELEGATE_SUCCESS' as const,
    UNDELEGATE: 'UNDELEGATE_SUCCESS' as const,
    CONNECTION: 'CONNECTION_SUCCESS' as const
  },

  // Generic errors
  GENERIC: {
    UNKNOWN: 'UNKNOWN_ERROR' as const,
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED' as const,
    NOT_SUPPORTED: 'NOT_SUPPORTED' as const,
    NOT_AUTHORIZED: 'NOT_AUTHORIZED' as const,
    NOT_FOUND: 'NOT_FOUND' as const
  },

  // API errors
  API: {
    ERROR: 'API_ERROR' as const,
    REQUEST_FAILED: 'API_REQUEST_FAILED' as const,
    NETWORK_ERROR: 'API_NETWORK_ERROR' as const,
    TIMEOUT: 'API_TIMEOUT' as const,
    INVALID_RESPONSE: 'API_INVALID_RESPONSE' as const
  },

  // WebSocket errors
  WEBSOCKET: {
    CONNECTION_ERROR: 'WEBSOCKET_CONNECTION_ERROR' as const,
    NOT_CONNECTED: 'WEBSOCKET_NOT_CONNECTED' as const,
    MAX_RETRIES_REACHED: 'WEBSOCKET_MAX_RETRIES_REACHED' as const,
    SUBSCRIPTION_ERROR: 'WEBSOCKET_SUBSCRIPTION_ERROR' as const
  },

  // Staking errors
  STAKING: {
    NOMINATION_FAILED: 'STAKING_NOMINATION_FAILED' as const,
    UNBONDING_FAILED: 'STAKING_UNBONDING_FAILED' as const,
    WITHDRAWAL_FAILED: 'STAKING_WITHDRAWAL_FAILED' as const,
    POOL_ERROR: 'STAKING_POOL_ERROR' as const,
    VALIDATOR_ERROR: 'STAKING_VALIDATOR_ERROR' as const,
    NOMINATION_ERROR: 'STAKING_NOMINATION_ERROR' as const,
    UNBONDING_ERROR: 'STAKING_UNBONDING_ERROR' as const,
    WITHDRAWAL_ERROR: 'STAKING_WITHDRAWAL_ERROR' as const,
    INSUFFICIENT_BALANCE: 'STAKING_INSUFFICIENT_BALANCE' as const,
    ALREADY_NOMINATED: 'STAKING_ALREADY_NOMINATED' as const
  },

  // Governance errors
  GOVERNANCE: {
    VOTE_FAILED: 'GOVERNANCE_VOTE_FAILED' as const,
    PROPOSAL_FAILED: 'GOVERNANCE_PROPOSAL_FAILED' as const,
    DELEGATION_FAILED: 'GOVERNANCE_DELEGATION_FAILED' as const,
    VOTE_ERROR: 'GOVERNANCE_VOTE_ERROR' as const,
    PROPOSAL_ERROR: 'GOVERNANCE_PROPOSAL_ERROR' as const,
    REFERENDUM_ERROR: 'GOVERNANCE_REFERENDUM_ERROR' as const,
    DELEGATION_ERROR: 'GOVERNANCE_DELEGATION_ERROR' as const
  },

  // New environment error
  ENV_ERROR: 'ENV_ERROR' as const,

  // Portfolio errors
  PORTFOLIO: {
    STATS_ERROR: 'PORTFOLIO_STATS_ERROR' as const,
    BALANCE_ERROR: 'PORTFOLIO_BALANCE_ERROR' as const,
    TOKEN_ERROR: 'PORTFOLIO_TOKEN_ERROR' as const,
    TRANSACTION_ERROR: 'PORTFOLIO_TRANSACTION_ERROR' as const,
    FETCH_ERROR: 'PORTFOLIO_FETCH_ERROR' as const,
    UPDATE_ERROR: 'PORTFOLIO_UPDATE_ERROR' as const
  },

  // OnRamp errors
  ONRAMP: {
    QUOTE_ERROR: 'ONRAMP_QUOTE_ERROR' as const,
    TRANSACTION_ERROR: 'ONRAMP_TRANSACTION_ERROR' as const,
    PROVIDER_ERROR: 'ONRAMP_PROVIDER_ERROR' as const,
    UNSUPPORTED_REGION: 'ONRAMP_UNSUPPORTED_REGION' as const,
    PAYMENT_FAILED: 'ONRAMP_PAYMENT_FAILED' as const,
    KYC_REQUIRED: 'ONRAMP_KYC_REQUIRED' as const
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
  'WALLET_NO_ACCOUNTS': 'No accounts found',
  'WALLET_NO_SIGNER': 'No signer available',
  'WALLET_SIGNER_ERROR': 'Failed to get signer',
  'WALLET_DISCONNECTED': 'Wallet disconnected',
  'WALLET_EXTENSION_LOAD_ERROR': 'Failed to load wallet extension',
  'WALLET_EXTENSION_NOT_AVAILABLE': 'Wallet extension not available',
  'WALLET_STATE_ERROR': 'Failed to update wallet state',
  'WALLET_ACCOUNT_NOT_FOUND': 'No account found in wallet',
  'WALLET_SIGNATURE_FAILED': 'Failed to sign message',
  'WALLET_REJECTED': 'Transaction rejected by user',
  'WALLET_EXTENSION_NOT_FOUND': 'Wallet extension not found',
  'WALLET_INVALID_ADDRESS': 'Invalid wallet address',
  'WALLET_TRANSACTION_FAILED': 'Transaction failed',
  'WALLET_INSUFFICIENT_BALANCE': 'Insufficient balance',
  'WALLET_NETWORK_ERROR': 'Network connection failed',
  'WALLET_TIMEOUT': 'Transaction timed out',
  'WALLET_USER_REJECTED': 'Transaction rejected by user',
  'WALLET_UNSUPPORTED_CHAIN': 'Unsupported chain',
  'WALLET_WRONG_NETWORK': 'Wrong network',
  
  // Environment errors
  'ENVIRONMENT_ERROR': 'Environment error',
  'SERVER_ERROR': 'Server error',
  'ENV_ERROR': 'Environment error',

  // Transaction errors
  'TRANSACTION_FAILED': 'Transaction failed',
  'TRANSACTION_REJECTED': 'Transaction rejected by user',
  'TRANSACTION_TIMEOUT': 'Transaction timed out',
  'INSUFFICIENT_BALANCE': 'Insufficient balance',
  'TRANSACTION_SUCCESS': 'Transaction successful',

  // Bridge errors
  'BRIDGE_UNAVAILABLE': 'Bridge service unavailable',
  'BRIDGE_ERROR': 'Bridge operation failed',
  'INVALID_DESTINATION': 'Invalid destination address',
  'AMOUNT_TOO_LOW': 'Amount is too low',
  'AMOUNT_TOO_HIGH': 'Amount is too high',
  'BRIDGE_ESTIMATE_ERROR': 'Failed to estimate bridge transaction',
  'BRIDGE_TRANSFER_ERROR': 'Bridge transfer failed',
  'BRIDGE_QUOTE_ERROR': 'Failed to get bridge quote',
  'BRIDGE_TRANSFER_FAILED': 'Bridge transfer failed',
  'BRIDGE_INSUFFICIENT_BALANCE': 'Insufficient balance for bridge',
  'BRIDGE_UNSUPPORTED_TOKEN': 'Token not supported by bridge',

  // Network errors
  'NETWORK_ERROR': 'Network error',
  'NETWORK_CONNECTION_ERROR': 'Network connection failed',
  'NETWORK_TIMEOUT': 'Network request timed out',
  'NETWORK_API_ERROR': 'API request failed',

  // Data errors
  'INVALID_DATA': 'Invalid data',
  'DATA_NOT_FOUND': 'Data not found',
  'PARSE_ERROR': 'Failed to parse data',
  'PROJECT_STATS_ERROR': 'Failed to load project stats',
  'PROJECT_FILTER_ERROR': 'Failed to filter projects',
  'ECOSYSTEM_LOAD_ERROR': 'Failed to load ecosystem data',
  'PROJECT_FETCH_ERROR': 'Failed to fetch project',
  'STAKING_ERROR': 'Staking operation failed',
  'INVALID_FORMAT': 'Invalid data format',
  'DATA_STALE': 'Data is stale',
  'CATEGORY_ERROR': 'Category error',
  'BALANCE_ERROR': 'Failed to get balance',
  'TRANSACTION_ERROR': 'Transaction error',

  // Validation errors
  'INVALID_ADDRESS': 'Invalid address',
  'INVALID_AMOUNT': 'Invalid amount',
  'INVALID_CHAIN': 'Invalid chain',
  'VALIDATION_INVALID_PARAMETER': 'Invalid parameter',
  'VALIDATION_MISSING_PARAMETER': 'Missing required parameter',
  'INVALID_STATE': 'Invalid state',
  'INVALID_INFO': 'Invalid information',
  'INVALID_INDEX': 'Invalid index',
  'INVALID_TARGET': 'Invalid target',
  'INVALID_TRACK': 'Invalid track',
  'INVALID_CONVICTION': 'Invalid conviction',
  'INVALID_PREIMAGE': 'Invalid preimage',
  'INVALID_ID': 'Invalid ID',
  'INVALID_RECIPIENT': 'Invalid recipient',

  // Authentication errors
  'AUTH_NO_SESSION': 'No active session',
  'AUTH_INVALID_TOKEN': 'Invalid authentication token',
  'AUTH_EXPIRED_TOKEN': 'Authentication token expired',
  'AUTH_INVALID_SIGNATURE': 'Invalid signature',
  'AUTH_UNAUTHORIZED': 'Unauthorized access',
  'AUTH_SESSION_EXPIRED': 'Session expired',
  'AUTH_MISSING_FIELDS': 'Missing required fields',
  'AUTH_MISSING_ADDRESS': 'Missing wallet address',
  'AUTH_CHALLENGE_NOT_FOUND': 'Authentication challenge not found',
  'AUTH_CHALLENGE_EXPIRED': 'Authentication challenge expired',
  'AUTH_VERIFICATION_FAILED': 'Verification failed',
  'AUTH_SESSION_CREATION_FAILED': 'Failed to create session',
  'NOT_AUTHENTICATED': 'Not authenticated',

  // Success messages
  'VOTE_SUCCESS': 'Vote successful',
  'DELEGATE_SUCCESS': 'Delegation successful',
  'UNDELEGATE_SUCCESS': 'Undelegation successful',
  'CONNECTION_SUCCESS': 'Connection successful',

  // Generic errors
  'UNKNOWN_ERROR': 'An unknown error occurred',
  'NOT_IMPLEMENTED': 'Feature not implemented',
  'NOT_SUPPORTED': 'Operation not supported',
  'NOT_AUTHORIZED': 'Not authorized',
  'NOT_FOUND': 'Resource not found',

  // API errors
  'API_ERROR': 'API error',
  'API_REQUEST_FAILED': 'API request failed',
  'API_NETWORK_ERROR': 'API network error',
  'API_TIMEOUT': 'API request timed out',
  'API_INVALID_RESPONSE': 'Invalid API response',

  // WebSocket errors
  'WEBSOCKET_CONNECTION_ERROR': 'WebSocket connection failed',
  'WEBSOCKET_NOT_CONNECTED': 'WebSocket not connected',
  'WEBSOCKET_MAX_RETRIES_REACHED': 'WebSocket max retries reached',
  'WEBSOCKET_SUBSCRIPTION_ERROR': 'WebSocket subscription failed',

  // Staking errors
  'STAKING_POOL_ERROR': 'Staking pool error',
  'STAKING_VALIDATOR_ERROR': 'Validator error',
  'STAKING_NOMINATION_ERROR': 'Nomination error',
  'STAKING_UNBONDING_ERROR': 'Unbonding error',
  'STAKING_WITHDRAWAL_ERROR': 'Withdrawal error',
  'STAKING_INSUFFICIENT_BALANCE': 'Insufficient balance for staking',
  'STAKING_ALREADY_NOMINATED': 'Already nominated',

  // Governance errors
  'GOVERNANCE_VOTE_FAILED': 'Vote failed',
  'GOVERNANCE_PROPOSAL_FAILED': 'Proposal failed',
  'GOVERNANCE_DELEGATION_FAILED': 'Delegation failed',
  'GOVERNANCE_VOTE_ERROR': 'Vote error',
  'GOVERNANCE_PROPOSAL_ERROR': 'Proposal error',
  'GOVERNANCE_REFERENDUM_ERROR': 'Referendum error',
  'GOVERNANCE_DELEGATION_ERROR': 'Delegation error',

  // Portfolio errors
  'PORTFOLIO_STATS_ERROR': 'Failed to load portfolio stats',
  'PORTFOLIO_BALANCE_ERROR': 'Failed to load portfolio balance',
  'PORTFOLIO_TOKEN_ERROR': 'Failed to load token data',
  'PORTFOLIO_TRANSACTION_ERROR': 'Portfolio transaction failed',
  'PORTFOLIO_FETCH_ERROR': 'Failed to fetch portfolio',
  'PORTFOLIO_UPDATE_ERROR': 'Failed to update portfolio',

  // OnRamp errors
  'ONRAMP_QUOTE_ERROR': 'Failed to get on-ramp quote',
  'ONRAMP_TRANSACTION_ERROR': 'On-ramp transaction failed',
  'ONRAMP_PROVIDER_ERROR': 'On-ramp provider error',
  'ONRAMP_UNSUPPORTED_REGION': 'Region not supported',
  'ONRAMP_PAYMENT_FAILED': 'Payment failed',
  'ONRAMP_KYC_REQUIRED': 'KYC verification required',

  // Staking errors
  'STAKING_NOMINATION_FAILED': 'Nomination failed',
  'STAKING_UNBONDING_FAILED': 'Unbonding failed',
  'STAKING_WITHDRAWAL_FAILED': 'Withdrawal failed'
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

export const ErrorMessages: Record<string, string> = {
  // API errors
  'API_REQUEST_FAILED': 'Failed to complete API request',
  'API_INVALID_RESPONSE': 'Invalid API response received',
  'API_NETWORK_ERROR': 'Network error occurred',

  // Wallet errors
  'WALLET_NOT_CONNECTED': 'Wallet is not connected',
  'WALLET_REJECTED': 'Transaction rejected by user',
  'WALLET_INVALID_ADDRESS': 'Invalid wallet address',
  'WALLET_EXTENSION_NOT_FOUND': 'Wallet extension not found',
  'WALLET_SIGNATURE_FAILED': 'Failed to sign transaction',

  // Portfolio errors
  'PORTFOLIO_STATS_ERROR': 'Failed to fetch portfolio statistics',
  'PORTFOLIO_BALANCE_ERROR': 'Failed to fetch portfolio balance',
  'PORTFOLIO_TOKEN_ERROR': 'Failed to fetch token information',
  'PORTFOLIO_TRANSACTION_ERROR': 'Failed to fetch transaction history',

  // Bridge errors
  'BRIDGE_ESTIMATE_ERROR': 'Failed to estimate bridge transaction',
  'BRIDGE_TRANSFER_ERROR': 'Failed to execute bridge transfer',
  'BRIDGE_QUOTE_ERROR': 'Failed to get bridge quote',

  // Staking errors
  'STAKING_POOL_ERROR': 'Failed to interact with staking pool',
  'STAKING_VALIDATOR_ERROR': 'Failed to fetch validator information',
  'STAKING_NOMINATION_ERROR': 'Failed to submit nomination',
  'STAKING_UNBONDING_ERROR': 'Failed to unbond tokens',
  'STAKING_WITHDRAWAL_ERROR': 'Failed to withdraw tokens',

  // Governance errors
  'GOVERNANCE_PROPOSAL_ERROR': 'Failed to submit proposal',
  'GOVERNANCE_VOTE_ERROR': 'Failed to submit vote',
  'GOVERNANCE_REFERENDUM_ERROR': 'Failed to fetch referendum information',
  'GOVERNANCE_DELEGATION_ERROR': 'Failed to delegate vote'
}; 