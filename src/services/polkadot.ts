import { ApiPromise, WsProvider } from '@polkadot/api';
import type { AccountInfo, StakingLedger, UnlockChunk } from '@polkadot/types/interfaces';
import type { Option } from '@polkadot/types';
import type { Vec } from '@polkadot/types/codec';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import { validateAddress } from '@polkadot/util-crypto';

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

class PolkadotService {
  private static instance: PolkadotService;
  public api: ApiPromise | null = null;
  private wsEndpoint: string;

  private constructor() {
    this.wsEndpoint = 'wss://rpc.polkadot.io';
  }

  static getInstance(): PolkadotService {
    if (!PolkadotService.instance) {
      PolkadotService.instance = new PolkadotService();
    }
    return PolkadotService.instance;
  }

  async connect(): Promise<ApiPromise> {
    try {
      // If already connected, return the existing API
      if (this.api?.isConnected) {
        return this.api;
      }

      // Create new connection
      this.api = await initializeApi(this.wsEndpoint);

      // Set up event handlers
      this.api.on('error', (error: Error) => {
        console.error('API error:', error);
      });

      this.api.on('disconnected', () => {
        console.warn('API disconnected. Attempting to reconnect...');
        this.api?.connect();
      });

      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          event: 'NETWORK_CONNECT',
          endpoint: this.wsEndpoint,
          status: 'connected'
        }
      });

      return this.api;
    } catch (error) {
      this.api = null;
      
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          error: String(error),
          endpoint: this.wsEndpoint
        }
      });

      throw handleError(error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.api) {
        await this.api.disconnect();
        this.api = null;

        await securityLogger.logEvent({
          type: SecurityEventType.API_ERROR,
          timestamp: new Date().toISOString(),
          details: {
            event: 'NETWORK_DISCONNECT',
            endpoint: this.wsEndpoint,
            status: 'disconnected'
          }
        });
      }
    } catch (error) {
      await securityLogger.logEvent({
        type: SecurityEventType.API_ERROR,
        timestamp: new Date().toISOString(),
        details: {
          error: String(error),
          action: 'DISCONNECT'
        }
      });
      throw handleError(error);
    }
  }

  async getApi(): Promise<ApiPromise> {
    try {
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
    } catch (error) {
      throw handleError(error);
    }
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