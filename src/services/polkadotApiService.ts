import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { formatBalance, BN } from '@polkadot/util';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import type { WalletAccount } from '@/services/walletService';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import type { 
  ValidatorInfo, 
  StakingInfo, 
  ChainInfo, 
  NominatorInfo, 
  TransactionStatus,
  ValidatorExposure
} from '@/types/staking';
import type { 
  Referendum, 
  Track, 
  DelegationInfo 
} from '@/types/governance';
import type { InjectedAccount } from '@polkadot/extension-inject/types';
import type { AccountId } from '@polkadot/types/interfaces';

// Helper types for runtime type checking
type StakingModule = NonNullable<ApiPromise['query']['staking']>;
type StakingQueries = {
  validators: NonNullable<StakingModule['validators']>;
  validatorPrefs: NonNullable<StakingModule['validatorPrefs']>;
  activeEra: NonNullable<StakingModule['activeEra']>;
  erasStakersPayout: NonNullable<StakingModule['erasStakersPayout']>;
};

// Add consistent logging with warning suppression for known issues
const log = {
  info: (message: string, ...args: any[]) => {
    console.log(`[PolkadotAPI] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[PolkadotAPI] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    // Filter out known warnings
    if (
      message.includes('RPC methods not decorated') ||
      message.includes('Not decorating runtime apis without matching versions') ||
      message.includes('Not decorating unknown runtime apis')
    ) {
      return;
    }
    console.warn(`[PolkadotAPI] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.debug(`[PolkadotAPI] ${message}`, ...args);
  },
  performance: (message: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`[PolkadotAPI] ${message} took ${duration}ms`);
  }
};

// Define error codes enum for consistency
export enum ErrorCode {
  API_ERROR = 'API_ERROR',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_VALIDATOR = 'INVALID_VALIDATOR',
  NOT_INITIALIZED = 'NOT_INITIALIZED'
}

class PolkadotApiService {
  private static instance: PolkadotApiService;
  private api: ApiPromise | null = null;
  private readonly wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'wss://rpc.polkadot.io';
  private chainInfo: ChainInfo | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 5000; // 5 seconds
  private selectedAccount: WalletAccount | null = null;

  private constructor() {
    log.info('Initializing PolkadotApiService');
  }

  static getInstance(): PolkadotApiService {
    if (!PolkadotApiService.instance) {
      PolkadotApiService.instance = new PolkadotApiService();
    }
    return PolkadotApiService.instance;
  }

  async getApi(): Promise<ApiPromise> {
    return this.ensureApi();
  }

  private async ensureApi(): Promise<ApiPromise> {
    if (!this.api) {
      const provider = new WsProvider(this.wsEndpoint);
      this.api = await ApiPromise.create({ provider });
    }
    return this.api;
  }

  async connect(): Promise<ApiPromise> {
    try {
      const startTime = Date.now();
      if (this.api?.isConnected) {
        log.info('Already connected to Polkadot network');
        return this.api;
      }

      log.info('Connecting to Polkadot network...');
      const provider = new WsProvider(this.wsEndpoint);
      
      // Configure API creation with runtime type overrides and RPC definitions
      this.api = await ApiPromise.create({
        provider,
        noInitWarn: true,
        throwOnConnect: true,
        throwOnUnknown: false,
        types: {
          // Add custom type definitions if needed
        }
      });

      // Wait for API to be ready and connected
      await this.api.isReady;

      // Verify required modules and queries are available
      const stakingModule = this.api.query.staking;
      if (!stakingModule) {
        log.error('Staking module not available');
        throw new PolkadotHubError(
          'Staking module not available',
          ErrorCodes.API.ERROR,
          'The staking module is not available on this chain'
        );
      }

      // Log all available staking queries for debugging
      const availableQueries = Object.keys(stakingModule).join(', ');
      log.debug(`Available staking queries: ${availableQueries}`);

      // Split queries into required and optional
      const requiredQueries = [
        'validators',
        'validatorPrefs',
        'activeEra'
      ];

      const optionalQueries = [
        'erasStakers',
        'erasStakersPayout',
        'erasValidatorReward'
      ];

      // Check required queries
      const missingRequiredQueries = requiredQueries.filter(query => !stakingModule[query]);
      if (missingRequiredQueries.length > 0) {
        log.error(`Missing required staking queries: ${missingRequiredQueries.join(', ')}`);
        throw new PolkadotHubError(
          'Required staking queries not available',
          ErrorCodes.API.ERROR,
          `Missing required staking queries: ${missingRequiredQueries.join(', ')}`
        );
      }

      // Log optional queries status
      const missingOptionalQueries = optionalQueries.filter(query => !stakingModule[query]);
      if (missingOptionalQueries.length > 0) {
        log.warn(`Missing optional staking queries: ${missingOptionalQueries.join(', ')}`);
      }

      // Initialize chain info
      await this.initializeChainInfo();

      log.performance('API connection and initialization', startTime);
      return this.api;
    } catch (error) {
      log.error('Failed to connect to Polkadot network:', error);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        log.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        return this.connect();
      }
      throw new PolkadotHubError(
        'Failed to connect to Polkadot network',
        ErrorCodes.API.NETWORK_ERROR,
        'Please check your internet connection and try again'
      );
    }
  }

  private getStakingModule(api: ApiPromise): StakingQueries {
    if (!api?.query?.staking) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'The staking module is not available on this chain'
      );
    }

    const stakingModule = api.query.staking;
    
    // Log available queries for debugging
    const availableQueries = Object.keys(stakingModule).join(', ');
    log.debug(`Available staking queries: ${availableQueries}`);

    // Create base query to use as fallback
    const baseQuery = stakingModule.validators;
    if (!baseQuery) {
      throw new PolkadotHubError(
        'Base staking query not available',
        ErrorCodes.API.ERROR,
        'Required staking functionality is not available'
      );
    }

    // Initialize queries with proper type assertions and fallbacks
    const queries: StakingQueries = {
      validators: baseQuery,
      validatorPrefs: stakingModule.validatorPrefs || baseQuery,
      activeEra: stakingModule.activeEra || baseQuery,
      erasStakersPayout: stakingModule.erasStakersPayout || baseQuery
    };

    // Log which queries are using fallbacks
    const usingFallbacks = Object.entries(queries)
      .filter(([key, value]) => value === baseQuery && key !== 'validators')
      .map(([key]) => key);
    
    if (usingFallbacks.length > 0) {
      log.warn(`Using fallback for queries: ${usingFallbacks.join(', ')}`);
    }

    return queries;
  }

  private async initializeChainInfo(): Promise<void> {
    const startTime = Date.now();
    log.info('Initializing chain information...');

    try {
      const api = await this.ensureApi();
      
      if (!api.rpc.system?.chain || !api.registry?.getChainProperties || !api.consts.system?.ss58Prefix) {
        throw new PolkadotHubError(
          'Required chain info queries not available',
          ErrorCodes.API.ERROR,
          'Cannot initialize chain information'
        );
      }

      const [chain, properties, ss58Format] = await Promise.all([
        api.rpc.system.chain(),
        api.registry.getChainProperties(),
        api.consts.system.ss58Prefix
      ]);

      const symbol = properties?.tokenSymbol?.value[0];
      const decimals = properties?.tokenDecimals?.value[0];

      this.chainInfo = {
        name: chain.toString(),
        tokenSymbol: symbol?.toString() || 'DOT',
        tokenDecimals: decimals ? Number(decimals.toString()) : 10,
        ss58Format: ss58Format ? Number(ss58Format.toString()) : 0
      };

      log.info(`Chain info initialized: ${this.chainInfo.name}`);
      log.performance('Chain info initialization', startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to initialize chain info:', error);
      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to initialize chain information'
      );
    }
  }

  async initializeWallet(): Promise<WalletAccount[]> {
    const startTime = Date.now();
    log.info('Initializing wallet...');

    try {
      // Enable all available extensions
      const extensions = await web3Enable('Polkadot Dashboard');
      if (extensions.length === 0) {
        throw new PolkadotHubError(
          'No wallet extension found',
          ErrorCodes.WALLET.NOT_FOUND,
          'Please install Polkadot.js extension'
        );
      }

      // Get all accounts
      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        throw new PolkadotHubError(
          'No accounts found',
          ErrorCodes.WALLET.NO_ACCOUNTS,
          'Please create or import an account in your wallet'
        );
      }

      // Validate and format accounts
      const validatedAccounts = accounts
        .map(acc => {
          try {
            const meta = {
              source: acc.meta.source,
              ...(acc.meta.name ? { name: acc.meta.name } : {}),
              ...(acc.meta.genesisHash ? { genesisHash: acc.meta.genesisHash } : {})
            };

            const account: WalletAccount = {
              ...acc,
              provider: acc.meta.source,
              meta
            };
            return account;
          } catch (error) {
            log.warn(`Failed to process account: ${error instanceof Error ? error.message : String(error)}`);
            return null;
          }
        })
        .filter((acc): acc is WalletAccount => acc !== null);

      if (validatedAccounts.length === 0) {
        throw new PolkadotHubError(
          'No valid accounts found',
          ErrorCodes.WALLET.NO_ACCOUNTS,
          'None of the available accounts could be processed'
        );
      }

      log.info(`Successfully initialized wallet with ${validatedAccounts.length} accounts`);
      log.performance('Wallet initialization', startTime);

      return validatedAccounts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to initialize wallet:', error);

      if (error instanceof PolkadotHubError) {
        throw error;
      }

      throw new PolkadotHubError(
        'Failed to initialize wallet',
        ErrorCodes.WALLET.CONNECTION_ERROR,
        errorMessage
      );
    }
  }

  async getAccountBalance(address: string): Promise<string> {
    const startTime = Date.now();
    log.info(`Getting balance for address: ${address}`);

    try {
      const api = await this.ensureApi();
      if (!api.query.system?.account) {
        throw new PolkadotHubError(
          'System account query not available',
          ErrorCodes.API.ERROR,
          'Required API endpoint is not available'
        );
      }

      const accountInfo = await api.query.system.account(address);
      const balance = (accountInfo as any).data?.free || new BN(0);
      const formattedBalance = formatBalance(balance, { withUnit: false, forceUnit: '-' });

      log.debug(`Balance retrieved: ${formattedBalance}`);
      log.performance('Balance query', startTime);

      return formattedBalance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Failed to get balance for address ${address}:`, error);
      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to get account balance'
      );
    }
  }

  async getStakingInfo(): Promise<StakingInfo> {
    try {
      const api = await this.ensureApi();
      const stakingModule = this.getStakingModule(api);

      // Get active era info with fallback
      let activeEra = 0;
      let eraIndex = 0;
      try {
        const activeEraOpt = await stakingModule.activeEra();
        if (activeEraOpt) {
          const unwrapped = (activeEraOpt as any).unwrapOrDefault();
          eraIndex = unwrapped.index.toNumber();
          activeEra = eraIndex;
        } else {
          // Fallback: try to get current era from system
          const currentEra = await api.query.staking?.currentEra?.();
          if (currentEra) {
            activeEra = (currentEra as any).unwrapOrDefault().toNumber();
            eraIndex = activeEra;
          }
        }
      } catch (error) {
        log.warn('Failed to get active era:', error);
      }

      // Get total stake with fallback
      let totalStaked = '0';
      try {
        if (api.query.staking?.erasTotalStake) {
          const total = await api.query.staking.erasTotalStake(eraIndex);
          totalStaked = total.toString();
        } else {
          // Alternative: sum up all validator stakes
          const validators = await stakingModule.validators.entries();
          let total = new BN(0);
          for (const [, validatorPrefs] of validators) {
            try {
              const exposure = await api.query.staking?.erasStakersClipped?.(eraIndex, validatorPrefs);
              if (exposure && (exposure as any).total) {
                total = total.add((exposure as any).total);
              }
            } catch (error) {
              log.warn('Failed to get validator exposure:', error);
            }
          }
          totalStaked = total.toString();
        }
      } catch (error) {
        log.warn('Failed to get total stake:', error);
      }

      // Get validator count with fallback
      let validatorCount = 0;
      try {
        if (api.query.staking?.validatorCount) {
          const count = await api.query.staking.validatorCount();
          validatorCount = (count as any).toNumber();
        } else {
          // Alternative: count validators directly
          const validators = await stakingModule.validators.entries();
          validatorCount = validators.length;
        }
      } catch (error) {
        log.warn('Failed to get validator count:', error);
      }

      // Get minimum stake with fallback
      let minimumStake = '0';
      try {
        if (api.query.staking?.minNominatorBond) {
          const minBond = await api.query.staking.minNominatorBond();
          minimumStake = minBond.toString();
        } else if (api.consts.staking?.minNominatorBond) {
          minimumStake = api.consts.staking.minNominatorBond.toString();
        }
      } catch (error) {
        log.warn('Failed to get minimum stake:', error);
      }

      // Get reward rate with fallback
      let rewardRate = '0';
      try {
        if (api.query.balances?.totalIssuance) {
          const totalIssuance = await api.query.balances.totalIssuance();
          const lastEraReward = await api.query.staking?.erasRewardPoints?.(eraIndex - 1);
          
          if (lastEraReward && totalIssuance) {
            const reward = (lastEraReward as any).total || new BN(0);
            const rate = reward
              .mul(new BN(100))
              .div(totalIssuance)
              .toNumber() / 1e10;
            rewardRate = rate.toString();
          }
        }
      } catch (error) {
        log.warn('Failed to calculate reward rate:', error);
      }

      const stakingInfo = {
        totalStaked,
        activeValidators: validatorCount,
        minimumStake,
        activeEra,
        rewardRate,
        stakingEnabled: true
      };

      log.debug('Staking info:', stakingInfo);
      return stakingInfo;
    } catch (error) {
      log.error('Failed to fetch staking info:', error);
      return {
        totalStaked: '0',
        activeValidators: 0,
        minimumStake: '0',
        activeEra: 0,
        rewardRate: '0',
        stakingEnabled: false
      };
    }
  }

  async getValidators(): Promise<ValidatorInfo[]> {
    const api = await this.ensureApi();

    try {
      // First check if we have access to the required modules
      if (!api.query?.staking || !api.query?.session?.validators) {
        throw new PolkadotHubError(
          'Required modules not available',
          ErrorCodes.API.ERROR,
          'Required staking or session queries are not available'
        );
      }

      const stakingModule = api.query.staking;

      // Get current validators from session module first
      const currentValidators = await api.query.session.validators();
      const validatorAddresses = (currentValidators as unknown as AccountId[]).map((v: AccountId) => v.toString());

      if (validatorAddresses.length === 0) {
        throw new PolkadotHubError(
          'No validators found',
          ErrorCodes.API.ERROR,
          'Could not retrieve any validators from the network'
        );
      }

      // Process each validator with proper error handling
      const validatorInfos = await Promise.all(
        validatorAddresses.map(async (address: string) => {
          try {
            // Fetch validator data with safe queries and proper error handling
            const [identity, prefs] = await Promise.all([
              api.query.identity?.identityOf?.(address).catch(() => null),
              stakingModule?.validatorPrefs?.(address).catch(() => null) || Promise.resolve(null)
            ]);

            // Get exposure data with proper error handling
            let totalStake = '0';
            let nominatorCount = 0;

            try {
              // Try erasStakersClipped first as it's more reliable
              if (stakingModule?.erasStakersClipped) {
                const exposure = await stakingModule.erasStakersClipped(0, address);
                if (exposure) {
                  const exposureData = exposure as unknown as ValidatorExposure;
                  totalStake = exposureData.total?.toString() || '0';
                  nominatorCount = exposureData.others?.length || 0;
                }
              }
            } catch (error) {
              log.warn(`Failed to get exposure for ${address}:`, error);
            }

            const validatorInfo: ValidatorInfo = {
              address,
              commission: prefs ? (prefs as any)?.commission?.toString() || '0' : '0',
              totalStake,
              nominators: nominatorCount,
              isActive: true,
              identity: identity ? {
                display: (identity as any)?.info?.display?.toString() || null,
                email: (identity as any)?.info?.email?.toString() || null,
                web: (identity as any)?.info?.web?.toString() || null,
                twitter: (identity as any)?.info?.twitter?.toString() || null
              } : null
            };

            return validatorInfo;
          } catch (error) {
            log.error(`Failed to process validator ${address}:`, error);
            return null;
          }
        })
      );

      return validatorInfos.filter((info: ValidatorInfo | null): info is ValidatorInfo => info !== null);
    } catch (error) {
      log.error('Failed to get validators:', error);
      throw new PolkadotHubError(
        'Failed to get validators',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not retrieve validator information. Please try again.'
      );
    }
  }

  async stake(amount: string, validators: string[]): Promise<void> {
    const api = await this.ensureApi();
    if (!api.tx.staking?.bond || !api.tx.staking?.nominate) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Required staking transactions are not available'
      );
    }

    if (!this.selectedAccount?.address) {
      throw new PolkadotHubError(
        'No account selected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to stake'
      );
    }

    const tx = api.tx.staking.bond(amount);
    await this.signAndSend(tx, this.selectedAccount.address);

    const nominateTx = api.tx.staking.nominate(validators);
    await this.signAndSend(nominateTx, this.selectedAccount.address);
  }

  async unstake(amount: string): Promise<void> {
    const api = await this.ensureApi();
    if (!api.tx.staking?.unbond) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Required staking transactions are not available'
      );
    }

    if (!this.selectedAccount?.address) {
      throw new PolkadotHubError(
        'No account selected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to unstake'
      );
    }

    const tx = api.tx.staking.unbond(amount);
    await this.signAndSend(tx, this.selectedAccount.address);
  }

  async withdrawUnstaked(): Promise<void> {
    const api = await this.ensureApi();
    if (!api.tx.staking?.withdrawUnbonded) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Required staking transactions are not available'
      );
    }

    if (!this.selectedAccount?.address) {
      throw new PolkadotHubError(
        'No account selected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to withdraw'
      );
    }

    const tx = api.tx.staking.withdrawUnbonded();
    await this.signAndSend(tx, this.selectedAccount.address);
  }

  private async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    address: string,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<void> {
    const startTime = Date.now();
    log.info('Signing and sending transaction...');

    const api = await this.ensureApi();

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, {}, ({ status, dispatchError, events }) => {
        try {
          if (status.isReady) {
            log.debug('Transaction is ready to be broadcast');
            onStatusChange?.({ isReady: true, isInBlock: false, isFinalized: false });
          } else if (status.isBroadcast) {
            log.debug('Transaction has been broadcast');
            onStatusChange?.({ isReady: true, isInBlock: false, isFinalized: false });
          } else if (status.isInBlock) {
            const blockHash = status.asInBlock.toHex();
            log.debug(`Transaction included in block: ${blockHash}`);
            onStatusChange?.({ isReady: true, isInBlock: true, isFinalized: false });
          } else if (status.isFinalized) {
            const blockHash = status.asFinalized.toHex();
            
            if (dispatchError) {
              const errorMessage = dispatchError.isModule 
                ? `Module Error: ${dispatchError.asModule.toString()}`
                : dispatchError.toString();
              
              log.error(`Transaction failed: ${errorMessage}`);
              onStatusChange?.({ isReady: true, isInBlock: true, isFinalized: true, error: errorMessage });
              reject(new PolkadotHubError(
                errorMessage,
                ErrorCodes.API.ERROR,
                'Transaction failed after finalization'
              ));
            } else {
              // Safe event checking
              const success = api.events?.system?.ExtrinsicSuccess && events.some(({ event }) => {
                try {
                  return api.events?.system?.ExtrinsicSuccess?.is(event);
                } catch {
                  return false;
                }
              });

              if (success) {
                log.info(`Transaction finalized in block: ${blockHash}`);
                log.performance('Transaction completion', startTime);
                onStatusChange?.({ isReady: true, isInBlock: true, isFinalized: true });
                resolve();
              } else {
                const errorMessage = 'Transaction finalized but no success event found';
                log.error(errorMessage);
                onStatusChange?.({ isReady: true, isInBlock: true, isFinalized: true, error: errorMessage });
                reject(new PolkadotHubError(
                  errorMessage,
                  ErrorCodes.API.ERROR,
                  'Transaction failed without explicit error'
                ));
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log.error('Error processing transaction status:', error);
          onStatusChange?.({ isReady: false, isInBlock: false, isFinalized: false, error: errorMessage });
          reject(new PolkadotHubError(
            errorMessage,
            ErrorCodes.API.ERROR,
            'Error processing transaction status'
          ));
        }
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error('Transaction submission failed:', error);
        onStatusChange?.({ isReady: false, isInBlock: false, isFinalized: false, error: errorMessage });
        reject(new PolkadotHubError(
          errorMessage,
          ErrorCodes.API.ERROR,
          'Failed to submit transaction'
        ));
      });
    });
  }

  getChainInfo(): ChainInfo {
    if (!this.chainInfo) {
      throw new PolkadotHubError(
        'Chain info not initialized',
        ErrorCodes.API.ERROR,
        'Chain information must be initialized before access'
      );
    }
    return { ...this.chainInfo }; // Return a copy to prevent mutation
  }

  async disconnect(): Promise<void> {
    log.info('Disconnecting from Polkadot network...');
    const startTime = Date.now();

    try {
      if (this.api) {
        // Remove all event listeners
        this.api.off('connected', () => {});
        this.api.off('disconnected', () => {});
        this.api.off('error', () => {});

        // Disconnect from the network
        await this.api.disconnect();
        this.api = null;
        this.chainInfo = null;
        this.reconnectAttempts = 0;

        log.info('Successfully disconnected from Polkadot network');
        log.performance('Network disconnection', startTime);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Error during disconnection:', error);
      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to disconnect from network'
      );
    }
  }

  async getNominatorInfo(address: string): Promise<NominatorInfo> {
    const api = await this.ensureApi();
    
    if (!api.query.staking) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Required staking queries are not available'
      );
    }

    const stakingQuery = api.query.staking;

    if (!stakingQuery.nominators || !stakingQuery.ledger || !stakingQuery.activeEra || !stakingQuery.erasStakersPayout) {
      throw new PolkadotHubError(
        'Required staking queries not available',
        ErrorCodes.API.ERROR,
        'Required staking queries are not available'
      );
    }

    try {
      const [nominations, ledger, activeEra] = await Promise.all([
        stakingQuery.nominators(address),
        stakingQuery.ledger(address),
        stakingQuery.activeEra()
      ]);

      if (!nominations || !ledger || !activeEra) {
        throw new PolkadotHubError(
          'Failed to fetch nominator data',
          ErrorCodes.API.ERROR,
          'Could not retrieve nominator information'
        );
      }

      const currentEra = (activeEra as any).unwrap().index.toNumber();
      const lastEraReward = await stakingQuery.erasStakersPayout(currentEra - 1, address);

      const nominationsData = (nominations as any).unwrap();
      const ledgerData = (ledger as any).unwrap();

      if (!nominationsData || !ledgerData) {
        throw new PolkadotHubError(
          'Invalid nominator data format',
          ErrorCodes.API.ERROR,
          'Could not parse nominator information'
        );
      }

      return {
        targets: nominationsData.targets.map((t: any) => t.toString()),
        totalStaked: ledgerData.active.toString(),
        rewards: {
          lastEra: lastEraReward.toString(),
          totalRewards: '0' // This would need to be calculated by summing historical rewards
        },
        status: 'active', // This should be determined by checking various conditions
        unlocking: ledgerData.unlocking.map((u: any) => ({
          value: u.value.toString(),
          era: u.era.toNumber()
        }))
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to process nominator info',
        ErrorCodes.API.ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async getHistoricalRewards(startEra: number, endEra: number) {
    const api = await this.ensureApi();
    const stakingModule = api.query.staking;

    if (!stakingModule?.erasRewardPoints) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.DATA.STAKING_ERROR,
        'The staking module is not available on this chain'
      );
    }

    const erasRewardPoints = stakingModule.erasRewardPoints;

    try {
      const rewards = await Promise.all(
        Array.from({ length: endEra - startEra + 1 }, (_, i) => startEra + i).map(async (era) => {
          try {
            const reward = await erasRewardPoints(era);
            return {
              era,
              reward: reward ? (reward as any).total?.toString() || '0' : '0'
            };
          } catch (error) {
            log.error(`Failed to fetch reward for era ${era}:`, error);
            return {
              era,
              reward: '0'
            };
          }
        })
      );
      return rewards;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch historical rewards',
        ErrorCodes.DATA.STAKING_ERROR,
        'Could not retrieve historical rewards data'
      );
    }
  }

  async getReferenda(): Promise<Referendum[]> {
    const api = await this.ensureApi();
    
    if (!api.query.referenda?.referendumInfoFor) {
      throw new PolkadotHubError(
        'Referenda module not available',
        ErrorCodes.API.ERROR,
        'Required referenda queries are not available'
      );
    }

    const referenda = await api.query.referenda.referendumInfoFor.entries();
    return referenda.map(([key, info]) => {
      const index = (key.args[0] as any).toNumber();
      const data = (info as any).unwrap();
      
      // Handle optional fields with type checking
      const status = data.status?.toString() || 'ongoing';
      const trackId = data.trackId?.toNumber() || 0;
      const proposer = data.proposer?.toString() || '';
      const deposit = data.deposit?.toString() || '0';
      const enactmentDelay = data.enactmentDelay?.toNumber() || 0;
      const voteStart = data.voteStart?.toNumber() || 0;
      const voteEnd = data.voteEnd?.toNumber() || 0;
      const ayes = data.ayes?.toString() || '0';
      const nays = data.nays?.toString() || '0';
      const turnout = data.turnout?.toString() || '0';
      const title = data.title?.toString() || '';
      const description = data.description?.toString() || '';

      return {
        index,
        title,
        description,
        status: status as 'ongoing' | 'completed' | 'cancelled',
        trackId,
        proposer,
        deposit,
        enactmentDelay,
        voteStart,
        voteEnd,
        ayes,
        nays,
        turnout
      };
    });
  }

  async getTracks(): Promise<Track[]> {
    const api = await this.ensureApi();
    
    if (!api.query.referenda?.tracks) {
      throw new PolkadotHubError(
        'Referenda module not available',
        ErrorCodes.API.ERROR,
        'Required referenda queries are not available'
      );
    }

    const tracks = await api.query.referenda.tracks.entries();
    return tracks.map(([key, info]) => {
      const id = (key.args[0] as any).toNumber();
      const data = (info as any).unwrap();

      // Handle optional fields with type checking
      const name = data.name?.toString() || '';
      const description = data.description?.toString() || '';
      const minDeposit = data.minDeposit?.toString() || '0';
      const decisionPeriod = data.decisionPeriod?.toNumber() || 0;
      const preparePeriod = data.preparePeriod?.toNumber() || 0;
      const enactmentPeriod = data.enactmentPeriod?.toNumber() || 0;
      const minApproval = data.minApproval?.toNumber() || 0;
      const minSupport = data.minSupport?.toNumber() || 0;

      return {
        id,
        name,
        description,
        minDeposit,
        decisionPeriod,
        preparePeriod,
        enactmentPeriod,
        minApproval,
        minSupport
      };
    });
  }

  async getDelegations(address?: string): Promise<DelegationInfo[]> {
    if (!address) return [];

    const api = await this.ensureApi();
    if (!api.query.convictionVoting?.votingFor) {
      throw new PolkadotHubError(
        'Conviction voting module not available',
        ErrorCodes.API.ERROR,
        'Required conviction voting queries are not available'
      );
    }

    const delegations = await api.query.convictionVoting.votingFor.entries(address);
    return delegations.map(([key, info]) => {
      const trackId = (key.args[1] as any).toNumber();
      const data = (info as any).unwrap();

      // Handle optional fields with type checking
      const target = data.target?.toString() || '';
      const amount = data.amount?.toString() || '0';
      const conviction = data.conviction?.toNumber() || 0;
      const delegatedAt = data.delegatedAt?.toNumber() || 0;

      return {
        trackId,
        target,
        amount,
        conviction,
        delegatedAt
      };
    });
  }

  async vote(referendumIndex: number, vote: boolean, conviction: number): Promise<void> {
    const api = await this.ensureApi();
    if (!api.tx.convictionVoting?.vote) {
      throw new PolkadotHubError(
        'Conviction voting module not available',
        ErrorCodes.API.ERROR,
        'Required conviction voting transactions are not available'
      );
    }

    if (!this.selectedAccount?.address) {
      throw new PolkadotHubError(
        'No account selected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to vote'
      );
    }

    const tx = api.tx.convictionVoting.vote(referendumIndex, { Standard: { vote, conviction } });
    await this.signAndSend(tx, this.selectedAccount.address);
  }

  async delegate(trackId: number, target: string, amount: string, conviction: number): Promise<void> {
    const api = await this.ensureApi();
    if (!api.tx.convictionVoting?.delegate) {
      throw new PolkadotHubError(
        'Conviction voting module not available',
        ErrorCodes.API.ERROR,
        'Required conviction voting transactions are not available'
      );
    }

    if (!this.selectedAccount?.address) {
      throw new PolkadotHubError(
        'No account selected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to delegate'
      );
    }

    const tx = api.tx.convictionVoting.delegate(trackId, target, conviction, amount);
    await this.signAndSend(tx, this.selectedAccount.address);
  }

  async undelegate(trackId: number): Promise<void> {
    const api = await this.ensureApi();
    if (!api.tx.convictionVoting?.undelegate) {
      throw new PolkadotHubError(
        'Conviction voting module not available',
        ErrorCodes.API.ERROR,
        'Required conviction voting transactions are not available'
      );
    }

    if (!this.selectedAccount?.address) {
      throw new PolkadotHubError(
        'No account selected',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Please connect your wallet to undelegate'
      );
    }

    const tx = api.tx.convictionVoting.undelegate(trackId);
    await this.signAndSend(tx, this.selectedAccount.address);
  }

  async bond(account: InjectedAccount, amount: string): Promise<any> {
    const api = await this.ensureApi();
    if (!api.tx.staking?.bond) {
      throw new Error('Staking module not available');
    }

    await web3Enable('Polkadot Dashboard');
    return api.tx.staking.bond(account.address, amount, 'Staked');
  }

  async nominate(targets: string[]): Promise<any> {
    const api = await this.ensureApi();
    if (!api.tx.staking?.nominate) {
      throw new Error('Staking module not available');
    }

    await web3Enable('Polkadot Dashboard');
    return api.tx.staking.nominate(targets);
  }

  async unbond(amount: string): Promise<any> {
    const api = await this.ensureApi();
    if (!api.tx.staking?.unbond) {
      throw new Error('Staking module not available');
    }

    await web3Enable('Polkadot Dashboard');
    return api.tx.staking.unbond(amount);
  }

  async withdrawUnbonded(account: InjectedAccount, numSlashingSpans: number) {
    const api = await this.ensureApi();
    
    if (!api.tx.staking?.withdrawUnbonded) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Required staking transactions are not available'
      );
    }

    if (!account.address) {
      throw new PolkadotHubError(
        'Invalid account',
        ErrorCodes.WALLET.NOT_CONNECTED,
        'Account address is required'
      );
    }

    return api.tx.staking.withdrawUnbonded(numSlashingSpans);
  }
}

export default PolkadotApiService.getInstance();