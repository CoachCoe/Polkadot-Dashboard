import { ApiPromise, WsProvider } from '@polkadot/api';
import type { AccountInfo, StakingLedger, UnlockChunk } from '@polkadot/types/interfaces';
import type { Option } from '@polkadot/types';
import type { Vec } from '@polkadot/types/codec';
import { handleError, PolkadotHubError } from '@/utils/errorHandling';
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

class PolkadotService {
  private api: ApiPromise | null = null;
  private connecting: Promise<ApiPromise> | null = null;
  private static instance: PolkadotService;
  private readonly wsEndpoint = 'wss://rpc.polkadot.io';

  private constructor() {}

  static getInstance(): PolkadotService {
    if (!PolkadotService.instance) {
      PolkadotService.instance = new PolkadotService();
    }
    return PolkadotService.instance;
  }

  private async connect(): Promise<ApiPromise> {
    if (!this.connecting) {
      this.connecting = (async () => {
        try {
          const provider = new WsProvider(this.wsEndpoint);
          this.api = await ApiPromise.create({ provider });

          if (!this.api.isConnected) {
            throw new PolkadotHubError(
              'Failed to establish connection',
              'NETWORK_ERROR',
              'Could not connect to Polkadot network'
            );
          }

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
          this.connecting = null;
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
      })();
    }
    return this.connecting;
  }

  async getApi(): Promise<ApiPromise> {
    try {
      if (!this.api) {
        await this.connect();
      }
      
      if (!this.api?.isConnected) {
        this.api = null;
        this.connecting = null;
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
          'NO_STAKE',
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

  async disconnect(): Promise<void> {
    try {
      if (this.api) {
        await this.api.disconnect();
        this.api = null;
        this.connecting = null;

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
}

export const polkadotService = PolkadotService.getInstance(); 