import { ApiPromise, WsProvider } from '@polkadot/api';
import type { AccountInfo, StakingLedger, UnlockChunk } from '@polkadot/types/interfaces';
import type { Option } from '@polkadot/types';
import type { Vec } from '@polkadot/types/codec';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { validateAddress } from '@polkadot/util-crypto';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import type { ProviderInterface } from '@polkadot/rpc-provider/types';

// Custom type that satisfies both WsProvider and ProviderInterface
type Provider = WsProvider & ProviderInterface;

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
    const provider = new WsProvider(endpoint) as Provider;

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
  private provider: Provider | undefined = undefined;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 5;
  private readonly reconnectDelay = 2000;
  private isConnecting = false;
  private readonly defaultEndpoints = [
    'wss://rpc.polkadot.io',
    'wss://polkadot.api.onfinality.io/public-ws',
    'wss://polkadot-rpc.dwellir.com',
    'wss://polkadot-rpc-tn.dwellir.com',
    'wss://polkadot.public.curie.radiumblock.co/ws'
  ] as const;
  private endpoints: string[];
  private currentEndpointIndex: number = 0;

  private constructor() {
    // Initialize with default endpoints
    this.endpoints = [...this.defaultEndpoints];
    this.wsEndpoint = this.defaultEndpoints[0];
    
    // Add environment endpoint if available and valid
    const envEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT;
    if (envEndpoint && envEndpoint.trim() && envEndpoint.startsWith('wss://')) {
      this.endpoints = [envEndpoint, ...this.defaultEndpoints];
      this.wsEndpoint = envEndpoint;
    }
  }

  public static getInstance(): PolkadotService {
    if (!PolkadotService.instance) {
      PolkadotService.instance = new PolkadotService();
    }
    return PolkadotService.instance;
  }

  private getNextEndpoint(): string {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;
    const nextEndpoint = this.endpoints[this.currentEndpointIndex];
    return nextEndpoint || this.defaultEndpoints[0];
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
      console.log('Attempting to connect to Polkadot network...');

      // Initialize WASM crypto first
      try {
        await cryptoWaitReady();
        console.log('WASM crypto initialized successfully');
      } catch (error) {
        console.warn('WASM crypto initialization failed:', error);
      }

      // Try each endpoint until one works
      while (this.connectionAttempts < this.maxConnectionAttempts) {
        try {
          console.log(`Attempting connection to ${this.wsEndpoint} (Attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`);

          // Clean up any existing connections
          await this.cleanup();

          // Create new provider with optimized settings
          this.provider = new WsProvider(this.wsEndpoint, 1000) as Provider;

          // Create API instance with minimal settings
          this.api = await ApiPromise.create({
            provider: this.provider,
            noInitWarn: true,
            throwOnConnect: false,
            throwOnUnknown: false
          });

          // Set up event handlers
          this.setupEventHandlers();

          // Wait for API to be ready
          await Promise.race([
            this.api.isReady,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 60000) // Increased to 60 seconds
            )
          ]);

          // Test a basic query to ensure the connection is working
          const systemQuery = this.api?.query?.system;
          if (!systemQuery?.number) {
            throw new Error('Required system methods not available');
          }
          await systemQuery.number();

          // Connection successful
          this.connectionAttempts = 0;
          this.isConnecting = false;
          console.log('Successfully connected to', this.wsEndpoint);
          return this.api;
        } catch (error) {
          console.warn(`Failed to connect to ${this.wsEndpoint}:`, error);
          
          // Clean up failed connection
          await this.cleanup();
          
          // Try next endpoint
          this.wsEndpoint = this.getNextEndpoint();
          this.connectionAttempts++;
          
          if (this.connectionAttempts < this.maxConnectionAttempts) {
            console.log(`Trying next endpoint: ${this.wsEndpoint}`);
            await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
            continue;
          }
        }
      }

      throw new PolkadotHubError(
        'Failed to connect to any endpoint',
        ErrorCodes.NETWORK.CONNECTION_ERROR,
        'Unable to connect to the network. Please check your internet connection and try again later.'
      );
    } catch (error) {
      this.isConnecting = false;
      console.error('Connection error:', error);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.api) {
        if (this.api.isConnected) {
          await this.api.disconnect();
        }
        this.api = null;
      }
      if (this.provider) {
        this.provider.disconnect();
        this.provider = undefined;
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.api || !this.provider) return;

    this.provider.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      void this.reconnect();
    });

    this.provider.on('disconnected', () => {
      console.warn('WebSocket disconnected');
      void this.reconnect();
    });

    this.provider.on('connected', () => {
      console.log('WebSocket connected');
      this.connectionAttempts = 0;
    });

    // Add specific API event handlers
    this.api.on('ready', () => {
      console.log('API is ready');
    });

    this.api.on('error', (error: Error) => {
      console.error('API error:', error);
      void this.reconnect();
    });
  }

  private async reconnect(): Promise<void> {
    if (this.isConnecting) return;
    
    try {
      console.log('Attempting to reconnect...');
      await this.connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
      // Try again after delay if not at max attempts
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        setTimeout(() => void this.reconnect(), this.reconnectDelay);
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.cleanup();
    this.connectionAttempts = 0;
    this.isConnecting = false;
  }

  async getApi(): Promise<ApiPromise> {
    if (!this.api || !this.api.isConnected) {
      await this.connect();
    }
    if (!this.api) {
      throw new PolkadotHubError(
        'API not initialized',
        ErrorCodes.API.ERROR,
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