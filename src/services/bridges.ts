import { ApiPromise } from '@polkadot/api';
import { polkadotService } from './polkadot';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';

export interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  existentialDeposit: string;
  bridgeEnabled: boolean;
  minTransfer?: string;
  maxTransfer?: string;
}

export interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  amount: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  sender: string;
  recipient: string;
  timestamp: string;
  error?: string;
}

interface RateLimitInfo {
  count: number;
  timestamp: number;
  lastWarning?: number;
}

const ADDRESS_REGEX = /^(0x)?[0-9a-fA-F]{64}$/;
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const WARNING_THRESHOLD = MAX_REQUESTS_PER_MINUTE * 0.8; // 80% of limit
const requestCounts = new Map<string, RateLimitInfo>();

function validateAddress(address: string): boolean {
  if (!address) return false;
  return ADDRESS_REGEX.test(address);
}

function validateAmount(amount: string): boolean {
  try {
    const amountBN = BigInt(amount);
    return amountBN > BigInt(0);
  } catch {
    return false;
  }
}

function checkRateLimit(address: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(address);

  if (!userRequests || (now - userRequests.timestamp) > RATE_LIMIT_WINDOW) {
    requestCounts.set(address, { count: 1, timestamp: now });
    return true;
  }

  // Check if we should log a warning
  if (userRequests.count >= WARNING_THRESHOLD && 
      (!userRequests.lastWarning || now - userRequests.lastWarning > RATE_LIMIT_WINDOW)) {
    void securityLogger.logEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      timestamp: new Date().toISOString(),
      details: {
        event: 'RATE_LIMIT_WARNING',
        address,
        requestCount: userRequests.count,
        threshold: WARNING_THRESHOLD
      }
    });
    userRequests.lastWarning = now;
  }

  if (userRequests.count >= MAX_REQUESTS_PER_MINUTE) {
    void securityLogger.logEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      timestamp: new Date().toISOString(),
      details: {
        address,
        requestCount: userRequests.count
      }
    });
    throw new PolkadotHubError(
      'Too many requests',
      ErrorCodes.BRIDGE.TRANSFER_ERROR,
      'Please wait before making more transfer requests.'
    );
  }

  userRequests.count++;
  requestCounts.set(address, userRequests);
  return true;
}

class BridgesService {
  private api: ApiPromise | null = null;
  private static instance: BridgesService;

  private supportedChains: ChainInfo[] = [
    {
      id: 'polkadot',
      name: 'Polkadot',
      symbol: 'DOT',
      decimals: 10,
      existentialDeposit: '1000000000', // 0.1 DOT
      bridgeEnabled: true,
      minTransfer: '10000000000', // 1 DOT
      maxTransfer: '100000000000000' // 10,000 DOT
    },
    {
      id: 'kusama',
      name: 'Kusama',
      symbol: 'KSM',
      decimals: 12,
      existentialDeposit: '100000000', // 0.0001 KSM
      bridgeEnabled: true,
      minTransfer: '1000000000000', // 1 KSM
      maxTransfer: '10000000000000000' // 10,000 KSM
    },
    {
      id: 'astar',
      name: 'Astar',
      symbol: 'ASTR',
      decimals: 18,
      existentialDeposit: '1000000000000000', // 0.001 ASTR
      bridgeEnabled: true,
      minTransfer: '10000000000000000000', // 10 ASTR
      maxTransfer: '100000000000000000000000' // 100,000 ASTR
    }
  ];

  private constructor() {}

  static getInstance(): BridgesService {
    if (!BridgesService.instance) {
      BridgesService.instance = new BridgesService();
    }
    return BridgesService.instance;
  }

  async getApi(): Promise<ApiPromise> {
    try {
      if (!this.api) {
        this.api = await polkadotService.getApi();
      }
      if (!this.api?.isConnected) {
        throw new PolkadotHubError(
          'Failed to connect to network',
          'NETWORK_ERROR',
          'Unable to establish connection to the blockchain network.'
        );
      }
      return this.api;
    } catch (error) {
      throw handleError(error);
    }
  }

  getSupportedChains(): ChainInfo[] {
    return this.supportedChains;
  }

  private validateBridgeTransfer(
    fromChain: ChainInfo,
    toChain: ChainInfo,
    amount: string,
    balance: string
  ): void {
    if (!fromChain.bridgeEnabled || !toChain.bridgeEnabled) {
      throw new PolkadotHubError(
        'Bridge not available',
        'BRIDGE_UNAVAILABLE',
        'The bridge between the selected chains is currently not available.'
      );
    }

    try {
      const amountBN = BigInt(amount);
      const balanceBN = BigInt(balance);
      const minTransferBN = BigInt(fromChain.minTransfer || '0');
      const maxTransferBN = BigInt(fromChain.maxTransfer || amount);

      if (amountBN > balanceBN) {
        throw new PolkadotHubError(
          'Insufficient balance',
          'INSUFFICIENT_BALANCE',
          `Available balance: ${balance} ${fromChain.symbol}`
        );
      }

      if (amountBN < minTransferBN) {
        throw new PolkadotHubError(
          'Amount below minimum',
          'AMOUNT_TOO_LOW',
          `Minimum transfer amount: ${fromChain.minTransfer} ${fromChain.symbol}`
        );
      }

      if (amountBN > maxTransferBN) {
        throw new PolkadotHubError(
          'Amount above maximum',
          'AMOUNT_TOO_HIGH',
          `Maximum transfer amount: ${fromChain.maxTransfer} ${fromChain.symbol}`
        );
      }
    } catch (error) {
      if (error instanceof PolkadotHubError) {
        throw error;
      }
      throw new PolkadotHubError(
        'Invalid amount',
        'INVALID_AMOUNT',
        'Please enter a valid transfer amount.'
      );
    }
  }

  async getBalance(address: string, chainId: string): Promise<string> {
    if (!validateAddress(address)) {
      throw new PolkadotHubError(
        'Invalid address',
        'INVALID_ADDRESS',
        'The provided address format is invalid.'
      );
    }

    const chain = this.supportedChains.find(c => c.id === chainId);
    if (!chain) {
      throw new PolkadotHubError(
        'Invalid chain',
        'INVALID_CHAIN',
        'The specified chain is not supported.'
      );
    }

    try {
      const api = await this.getApi();
      if (!api.query?.system?.account) {
        throw new PolkadotHubError(
          'API not ready',
          'API_ERROR',
          'The blockchain API is not properly initialized.'
        );
      }

      const balance = await api.query.system.account(address);
      const accountData = balance.toJSON();
      
      if (!accountData || 
          typeof accountData !== 'object' || 
          !('data' in accountData) ||
          typeof accountData.data !== 'object' ||
          !accountData.data ||
          !('free' in accountData.data) ||
          typeof accountData.data.free !== 'string') {
        throw new PolkadotHubError(
          'Invalid balance data',
          ErrorCodes.DATA.INVALID,
          'Failed to retrieve account balance.'
        );
      }

      return accountData.data.free;
    } catch (error) {
      throw handleError(error);
    }
  }

  async getBridgeTransactions(address: string): Promise<BridgeTransaction[]> {
    if (!validateAddress(address)) {
      throw new PolkadotHubError(
        'Invalid address',
        'INVALID_ADDRESS',
        'The provided address format is invalid.'
      );
    }

    try {
      // In a real implementation, this would fetch actual bridge transactions from the chain
      return [
        {
          id: '0x123',
          fromChain: 'polkadot',
          toChain: 'kusama',
          amount: '10000000000', // 1 DOT
          status: 'Completed',
          sender: address,
          recipient: address,
          timestamp: new Date(Date.now() - 86400000).toISOString() // 24 hours ago
        },
        {
          id: '0x456',
          fromChain: 'kusama',
          toChain: 'astar',
          amount: '500000000', // 0.5 KSM
          status: 'Pending',
          sender: address,
          recipient: address,
          timestamp: new Date().toISOString()
        }
      ];
    } catch (error) {
      throw handleError(error);
    }
  }

  async initiateBridgeTransfer(
    fromChainId: string,
    toChainId: string,
    amount: string,
    recipient: string
  ) {
    // Rate limiting check
    if (!checkRateLimit(recipient)) {
      throw new PolkadotHubError(
        'Too many requests',
        ErrorCodes.BRIDGE.TRANSFER_ERROR,
        'Please wait before making more transfer requests.'
      );
    }

    // Input validation
    if (!validateAddress(recipient)) {
      throw new PolkadotHubError(
        'Invalid recipient address',
        'INVALID_ADDRESS',
        'The recipient address format is invalid.'
      );
    }

    if (!validateAmount(amount)) {
      throw new PolkadotHubError(
        'Invalid amount',
        'INVALID_AMOUNT',
        'Please enter a valid transfer amount.'
      );
    }

    const fromChain = this.supportedChains.find(c => c.id === fromChainId);
    const toChain = this.supportedChains.find(c => c.id === toChainId);

    if (!fromChain || !toChain) {
      throw new PolkadotHubError(
        'Invalid chain selection',
        'INVALID_CHAIN',
        'One or both of the selected chains are invalid.'
      );
    }

    try {
      const api = await this.getApi();
      const balance = await this.getBalance(recipient, fromChainId);
      this.validateBridgeTransfer(fromChain, toChain, amount, balance);

      // Log the transfer attempt
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'BRIDGE_TRANSFER',
          fromChain: fromChainId,
          toChain: toChainId,
          amount,
          recipient
        }
      });

      // This is a placeholder for the actual bridge transfer logic
      if (!api.tx?.system?.remark) {
        throw new PolkadotHubError(
          'API not ready',
          'API_ERROR',
          'The blockchain API is not properly initialized.'
        );
      }

      const tx = api.tx.system.remark(`Bridge transfer: ${amount} from ${fromChainId} to ${toChainId}`);
      return tx;
    } catch (error) {
      throw handleError(error);
    }
  }

  async estimateBridgeFees(
    fromChainId: string,
    toChainId: string,
    amount: string
  ): Promise<{
    bridgeFee: string;
    destinationFee: string;
    estimatedTime: string;
  }> {
    const fromChain = this.supportedChains.find(c => c.id === fromChainId);
    const toChain = this.supportedChains.find(c => c.id === toChainId);

    if (!fromChain || !toChain) {
      throw new PolkadotHubError(
        'Invalid chain selection',
        'INVALID_CHAIN',
        'One or both of the selected chains are invalid.'
      );
    }

    if (!fromChain.bridgeEnabled || !toChain.bridgeEnabled) {
      throw new PolkadotHubError(
        'Bridge not available',
        'BRIDGE_UNAVAILABLE',
        'The bridge between the selected chains is currently not available.'
      );
    }

    if (!validateAmount(amount)) {
      throw new PolkadotHubError(
        'Invalid amount',
        'INVALID_AMOUNT',
        'Please enter a valid amount for fee estimation.'
      );
    }

    try {
      // In a real implementation, this would calculate actual fees
      return {
        bridgeFee: '100000000', // 0.1 units
        destinationFee: '50000000', // 0.05 units
        estimatedTime: '15 minutes'
      };
    } catch (error) {
      throw handleError(error);
    }
  }
}

export const bridgesService = BridgesService.getInstance(); 