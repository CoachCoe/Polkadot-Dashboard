import { ApiPromise, WsProvider } from '@polkadot/api';
import type { AccountInfo, StakingLedger, UnlockChunk } from '@polkadot/types/interfaces';
import type { Option } from '@polkadot/types';
import type { Vec } from '@polkadot/types/codec';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { validateAddress } from '@polkadot/util-crypto';
import { cryptoWaitReady } from '@polkadot/util-crypto';

interface StakingResponse {
  balance: string;
  stakingInfo: {
    active: string;
    total: string;
    unlocking: Array<{
      value: string;
      era: string;
    }>;
  } | null;
}

export const initializeApi = async (endpoint: string = 'wss://rpc.polkadot.io'): Promise<ApiPromise> => {
  try {
    // Create provider
    const provider = new WsProvider(endpoint);

    // Initialize API with custom options
    const api = await ApiPromise.create({
      provider,
      noInitWarn: true // Suppress initialization warnings
    });

    // Wait for API to be ready
    await api.isReady;

    return api;
  } catch (error) {
    console.error('Failed to initialize Polkadot API:', error);
    throw error;
  }
};

export class PolkadotService {
  private static instance: PolkadotService;
  public api: ApiPromise | null = null;
  private wsEndpoint: string;
  private provider: WsProvider | null = null;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 5;
  private readonly reconnectDelay = 5000;
  private isConnecting = false;

  private constructor() {
    this.wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://rpc.polkadot.io';
  }

  public static getInstance(): PolkadotService {
    if (!PolkadotService.instance) {
      PolkadotService.instance = new PolkadotService();
    }
    return PolkadotService.instance;
  }

  async connect(): Promise<ApiPromise> {
    try {
      // If already connected, return existing API
      if (this.api?.isConnected) {
        return this.api;
      }

      // If already attempting to connect, wait for that attempt
      if (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.connect();
      }

      this.isConnecting = true;

      // Initialize WASM crypto first
      try {
        await cryptoWaitReady();
        console.log('WASM crypto initialized successfully');
      } catch (error) {
        console.warn('WASM crypto initialization failed:', error);
      }

      // Create new provider if needed
      if (!this.provider) {
        this.provider = new WsProvider(this.wsEndpoint);
      }

      // Create API instance
      this.api = await ApiPromise.create({
        provider: this.provider,
        noInitWarn: true,
        throwOnConnect: true,
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Wait for API to be ready
      await this.api.isReady;

      // Reset connection attempts on successful connection
      this.connectionAttempts = 0;
      this.isConnecting = false;

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'NETWORK_CONNECT',
          status: 'connected'
        }
      });

      return this.api;
    } catch (error) {
      this.isConnecting = false;
      await this.handleConnectionError(error);
      
      // Attempt reconnection if within limits
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.connectionAttempts++;
        console.warn(`Connection attempt ${this.connectionAttempts} failed. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        return this.connect();
      }

      throw new PolkadotHubError(
        'Failed to connect to network after multiple attempts',
        'NETWORK_ERROR',
        'Unable to establish connection to the blockchain network.'
      );
    }
  }

  private setupEventHandlers() {
    if (!this.api || !this.provider) return;

    // Set up new handlers
    this.provider.on('error', this.handleError);
    this.provider.on('disconnected', this.handleDisconnect);
    this.provider.on('connected', this.handleConnect);
  }

  private async handleConnectionError(error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: errorMessage,
        attempts: this.connectionAttempts
      }
    });
  }

  private async reconnect() {
    try {
      this.connectionAttempts++;
      console.warn(`Attempting to reconnect (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
      
      // Clean up existing connection
      await this.disconnect();
      
      // Create new provider
      this.provider = new WsProvider(this.wsEndpoint);
      
      // Attempt reconnection
      await this.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.api) {
        // Remove all event listeners first
        this.api.off('disconnected', () => {});
        this.api.off('connected', () => {});
        this.api.off('error', () => {});
        
        // Then disconnect
        await this.api.disconnect();
        this.api = null;
      }
      if (this.provider) {
        // Remove WebSocket event listeners by replacing them with empty functions
        this.provider.on('error', () => {});
        this.provider.on('disconnected', () => {});
        this.provider.on('connected', () => {});
        
        // Then disconnect
        await this.provider.disconnect();
        this.provider = null;
      }
      this.connectionAttempts = 0;
      this.isConnecting = false;
    } catch (error) {
      console.error('Error during disconnection:', error);
      // Don't throw the error as we're cleaning up
    }
  }

  private handleError = async (error: Error) => {
    console.error('WebSocket error:', error);
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        error: error.message
      }
    });
  };

  private handleDisconnect = async () => {
    console.warn('WebSocket disconnected');
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        event: 'NETWORK_DISCONNECT'
      }
    });
    void this.reconnect();
  };

  private handleConnect = () => {
    console.log('WebSocket connected');
  };

  async getApi(): Promise<ApiPromise> {
    if (!this.api || !this.api.isConnected) {
      await this.connect();
    }
    if (!this.api) {
      throw new PolkadotHubError(
        'API not initialized',
        'API_ERROR',
        'Failed to initialize Polkadot API'
      );
    }
    return this.api;
  }

  async getStakingInfo(address: string): Promise<StakingResponse> {
    if (!address || !validateAddress(address)) {
      throw new PolkadotHubError(
        'Invalid address',
        'INVALID_ADDRESS',
        'The provided address is not a valid Polkadot address'
      );
    }

    try {
      const api = await this.getApi();
      
      if (!api.query?.system?.account || !api.query?.staking?.ledger) {
        throw new PolkadotHubError(
          'API not ready',
          'API_ERROR',
          'Required API endpoints are not available'
        );
      }

      const [accountInfo, stakingLedger] = await Promise.all([
        api.query.system.account<AccountInfo>(address),
        api.query.staking.ledger<Option<StakingLedger>>(address)
      ]);

      if (!accountInfo?.data) {
        throw new PolkadotHubError(
          'Invalid account info',
          'INVALID_DATA',
          'Failed to fetch account information'
        );
      }

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'DATA_READ',
          action: 'GET_STAKING_INFO',
          address
        }
      });

      return {
        balance: accountInfo.data.free.toString(),
        stakingInfo: stakingLedger.isSome ? {
          active: stakingLedger.unwrap().active.toString(),
          total: stakingLedger.unwrap().total.toString(),
          unlocking: stakingLedger.unwrap().unlocking.map((unlock: UnlockChunk) => ({
            value: unlock.value.toString(),
            era: unlock.era.toString()
          }))
        } : null
      };
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          error: String(error),
          address
        }
      });
      throw handleError(error);
    }
  }

  async getValidators(): Promise<string[]> {
    try {
      const api = await this.getApi();
      
      if (!api.query?.session?.validators) {
        throw new PolkadotHubError(
          'API not ready',
          'API_ERROR',
          'Validators endpoint is not available'
        );
      }

      const validators = await api.query.session.validators<Vec<AccountInfo>>();
      
      if (!validators) {
        throw new PolkadotHubError(
          'Invalid validator data',
          'INVALID_DATA',
          'Failed to fetch validator information'
        );
      }

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'DATA_READ',
          action: 'GET_VALIDATORS'
        }
      });

      return validators.toArray().map((validator: AccountInfo) => validator.toString());
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          error: String(error)
        }
      });
      throw handleError(error);
    }
  }

  async stake(address: string, signer: any, amount: string, validatorId: string): Promise<void> {
    if (!address || !validateAddress(address)) {
      throw new PolkadotHubError(
        'Invalid address',
        'INVALID_ADDRESS',
        'The provided address is not a valid Polkadot address'
      );
    }

    try {
      const api = await this.getApi();
      
      if (!api.tx?.staking?.bond) {
        throw new PolkadotHubError(
          'API not ready',
          'API_ERROR',
          'Staking functionality is not available'
        );
      }

      const tx = api.tx.staking.bond(validatorId, amount, 'Staked');
      await tx.signAndSend(address, { signer });

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'STAKE',
          address,
          amount,
          validatorId
        }
      });
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          error: String(error),
          address,
          amount,
          validatorId
        }
      });
      throw handleError(error);
    }
  }

  async unstake(address: string, signer: any, validatorId: string): Promise<void> {
    if (!address || !validateAddress(address)) {
      throw new PolkadotHubError(
        'Invalid address',
        'INVALID_ADDRESS',
        'The provided address is not a valid Polkadot address'
      );
    }

    try {
      const api = await this.getApi();
      
      if (!api.tx?.staking?.unbond) {
        throw new PolkadotHubError(
          'API not ready',
          'API_ERROR',
          'Unstaking functionality is not available'
        );
      }

      const stakingInfo = await this.getStakingInfo(address);
      if (!stakingInfo.stakingInfo?.active) {
        throw new PolkadotHubError(
          'No active stake',
          ErrorCodes.DATA.NOT_FOUND,
          'No active stake found for this address'
        );
      }

      const tx = api.tx.staking.unbond(stakingInfo.stakingInfo.active);
      await tx.signAndSend(address, { signer });

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'UNSTAKE',
          address,
          validatorId,
          amount: stakingInfo.stakingInfo.active
        }
      });
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          error: String(error),
          address,
          validatorId
        }
      });
      throw handleError(error);
    }
  }
}

export const polkadotService = PolkadotService.getInstance(); 