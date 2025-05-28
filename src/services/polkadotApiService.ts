import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { formatBalance, BN } from '@polkadot/util';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';
import type { WalletAccount } from '@/services/walletService';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import type { 
  ValidatorInfo, 
  StakingInfo, 
  ChainInfo, 
  NominatorInfo, 
  TransactionStatus, 
  ValidatorIdentity 
} from '@/types/staking';
import type { 
  Referendum, 
  Track, 
  DelegationInfo 
} from '@/types/governance';

// Helper types for runtime type checking
type StakingModule = NonNullable<ApiPromise['query']['staking']>;
type StakingQueries = {
  validators: NonNullable<StakingModule['validators']>;
  validatorPrefs: NonNullable<StakingModule['validatorPrefs']>;
  erasStakers: NonNullable<StakingModule['erasStakers']>;
  activeEra: NonNullable<StakingModule['activeEra']>;
  erasStakersPayout: NonNullable<StakingModule['erasStakersPayout']>;
  erasValidatorReward: NonNullable<StakingModule['erasValidatorReward']>;
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
  private wsEndpoint: string;
  private chainInfo: ChainInfo | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 5000; // 5 seconds
  private selectedAccount: WalletAccount | null = null;

  private constructor() {
    this.wsEndpoint = process.env.NEXT_PUBLIC_POLKADOT_RPC || 'wss://rpc.polkadot.io';
    log.info('Initializing PolkadotApiService');
  }

  static getInstance(): PolkadotApiService {
    if (!PolkadotApiService.instance) {
      PolkadotApiService.instance = new PolkadotApiService();
    }
    return PolkadotApiService.instance;
  }

  private async getApi(): Promise<ApiPromise> {
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
        throwOnConnect: false,
        throwOnUnknown: false,
        types: {
          // Add custom type definitions if needed
        },
        rpc: {
          archive: {
            body: {
              description: 'Get block body',
              params: [{ name: 'hash', type: 'Hash' }],
              type: 'Vec<Extrinsic>'
            },
            call: {
              description: 'Get runtime call',
              params: [{ name: 'hash', type: 'Hash' }],
              type: 'Call'
            },
            finalizedHeight: {
              description: 'Get finalized height',
              params: [],
              type: 'BlockNumber'
            },
            genesisHash: {
              description: 'Get genesis hash',
              params: [],
              type: 'Hash'
            },
            hashByHeight: {
              description: 'Get block hash by height',
              params: [{ name: 'height', type: 'BlockNumber' }],
              type: 'Hash'
            },
            header: {
              description: 'Get block header',
              params: [{ name: 'hash', type: 'Hash' }],
              type: 'Header'
            },
            storage: {
              description: 'Get storage',
              params: [{ name: 'key', type: 'StorageKey' }],
              type: 'StorageData'
            }
          },
          chainHead: {
            body: {
              description: 'Get block body',
              params: [{ name: 'hash', type: 'Hash' }],
              type: 'Vec<Extrinsic>'
            },
            call: {
              description: 'Get runtime call',
              params: [{ name: 'hash', type: 'Hash' }],
              type: 'Call'
            },
            header: {
              description: 'Get block header',
              params: [{ name: 'hash', type: 'Hash' }],
              type: 'Header'
            },
            storage: {
              description: 'Get storage',
              params: [{ name: 'key', type: 'StorageKey' }],
              type: 'StorageData'
            }
          },
          chainSpec: {
            chainName: {
              description: 'Get chain name',
              params: [],
              type: 'Text'
            },
            genesisHash: {
              description: 'Get genesis hash',
              params: [],
              type: 'Hash'
            },
            properties: {
              description: 'Get chain properties',
              params: [],
              type: 'ChainProperties'
            }
          },
          transactionWatch: {
            submitAndWatch: {
              description: 'Submit and watch transaction',
              params: [{ name: 'tx', type: 'Bytes' }],
              type: 'Hash'
            },
            unwatch: {
              description: 'Unwatch transaction',
              params: [{ name: 'hash', type: 'Hash' }],
              type: 'Bool'
            }
          },
          transaction: {
            broadcast: {
              description: 'Broadcast transaction',
              params: [{ name: 'tx', type: 'Bytes' }],
              type: 'Hash'
            }
          }
        }
      });

      // Set up connection monitoring with improved error handling
      this.api.on('connected', () => {
        log.info('Connected to Polkadot network');
        this.reconnectAttempts = 0;
        this.handleConnectionEvent('connected');
      });

      this.api.on('disconnected', () => {
        log.warn('Disconnected from Polkadot network');
        this.handleConnectionEvent('disconnected');
        this.attemptReconnect();
      });

      this.api.on('error', (error: Error) => {
        // Filter out known non-critical errors
        if (
          error.message.includes('RPC methods not decorated') ||
          error.message.includes('Not decorating runtime apis') ||
          error.message.includes('unknown runtime apis')
        ) {
          log.debug('Non-critical API error:', error.message);
          return;
        }
        log.error('Polkadot network error:', error);
        this.handleConnectionEvent('error', error);
      });

      await this.api.isReady;
      await this.initializeChainInfo();

      log.performance('Network connection', startTime);
      return this.api;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to connect to Polkadot network:', error);
      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to connect to Polkadot network'
      );
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;
    log.info(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        log.error('Reconnection attempt failed:', error);
      }
    }, this.reconnectDelay);
  }

  private async handleConnectionEvent(status: 'connected' | 'disconnected' | 'error', error?: Error) {
    await securityLogger.logEvent({
      type: SecurityEventType.API_ERROR,
      timestamp: new Date().toISOString(),
      details: {
        event: 'NETWORK_STATUS',
        status,
        error: error?.message
      }
    });

    if (status === 'disconnected') {
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async initializeChainInfo(): Promise<void> {
    const startTime = Date.now();
    log.info('Initializing chain information...');

    try {
      const api = await this.getApi();
      
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
      const api = await this.getApi();
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

  private getStakingModule(api: ApiPromise): StakingQueries {
    if (!api.query.staking) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const stakingModule = api.query.staking;
    
    // Log available queries for debugging
    const availableQueries = Object.keys(stakingModule).join(', ');
    log.debug(`Available staking queries: ${availableQueries}`);

    // Create a base query to use as fallback
    const baseQuery = stakingModule.validators;
    if (!baseQuery) {
      throw new PolkadotHubError(
        'Base staking query not available',
        ErrorCodes.API.ERROR,
        'Required staking functionality is not available'
      );
    }

    // Initialize queries with proper type assertions
    const queries: StakingQueries = {
      validators: baseQuery,
      validatorPrefs: (stakingModule.validatorPreferences || stakingModule.validatorPrefs || baseQuery) as StakingQueries['validatorPrefs'],
      erasStakers: (stakingModule.erasStakers || stakingModule.erasStakersClipped || baseQuery) as StakingQueries['erasStakers'],
      activeEra: (stakingModule.activeEra || baseQuery) as StakingQueries['activeEra'],
      erasStakersPayout: (stakingModule.erasStakersPayout || stakingModule.erasRewardPoints || baseQuery) as StakingQueries['erasStakersPayout'],
      erasValidatorReward: (stakingModule.erasValidatorReward || baseQuery) as StakingQueries['erasValidatorReward']
    };

    // Log which queries are using fallbacks
    const usingFallbacks = Object.entries(queries).filter(([, value]) => value === baseQuery);
    if (usingFallbacks.length > 0) {
      log.warn(`Using fallback for queries: ${usingFallbacks.map(([key]) => key).join(', ')}`);
    }

    return queries;
  }

  async getStakingInfo(): Promise<StakingInfo> {
    try {
      const api = await this.getApi();
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
        }
      } catch (error) {
        log.warn('Failed to get minimum stake:', error);
      }

      // Get reward rate with fallback
      let rewardRate = '0';
      try {
        if (api.query.staking?.erasValidatorReward && api.query.balances?.totalIssuance) {
          const [erasValidatorReward, totalIssuance] = await Promise.all([
            api.query.staking.erasValidatorReward(eraIndex - 1),
            api.query.balances.totalIssuance()
          ]);

          if (erasValidatorReward && totalIssuance) {
            const reward = (erasValidatorReward as any).unwrapOrDefault();
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

      return {
        totalStaked,
        activeValidators: validatorCount,
        minimumStake,
        activeEra,
        rewardRate,
        stakingEnabled: true
      };
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
    const api = await this.getApi();
    const stakingModule = this.getStakingModule(api);

    try {
      const validators = await stakingModule.validators.entries();
      const validatorInfos = await Promise.all(
        validators.map(async ([key, _]) => {
          try {
            // Runtime check for key structure
            if (!key?.args?.[0]?.toString) {
              console.error('Invalid validator key format');
              return null;
            }

            const address = key.args[0].toString();
            
            // Safe query calls with fallbacks
            const [identity, commission, activeEraOpt] = await Promise.all([
              api.query.identity?.identityOf?.(address) || Promise.resolve(null),
              stakingModule.validatorPrefs(address),
              stakingModule.activeEra()
            ]);

            let exposure = null;
            if (activeEraOpt) {
              try {
                // We know these methods exist on Polkadot types
                const activeEra = (activeEraOpt as unknown as { unwrap: () => any }).unwrap();
                exposure = await stakingModule.erasStakers(activeEra, address);
              } catch (error) {
                console.error('Failed to get era stakers:', error);
              }
            }

            // Safe data extraction with fallbacks
            const validatorInfo: ValidatorInfo = {
              address,
              commission: (commission as any)?.commission?.toString() || '0',
              totalStake: (exposure as any)?.total?.toString() || '0',
              nominators: (exposure as any)?.others?.length || 0,
              isActive: true,
              rewardPoints: '0'
            };

            // Safe identity extraction
            try {
              if (identity) {
                const identityInfo = (identity as unknown as { unwrapOr: (defaultValue: any) => any })
                  .unwrapOr(null)?.info?.toHuman();
                if (identityInfo) {
                  validatorInfo.identity = identityInfo as ValidatorIdentity;
                }
              }
            } catch (error) {
              console.error('Failed to process identity info:', error);
            }

            return validatorInfo;
          } catch (error) {
            console.error('Failed to process validator:', error);
            return null;
          }
        })
      );

      return validatorInfos.filter((info): info is ValidatorInfo => info !== null);
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch validator info',
        ErrorCodes.API.ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async stake(amount: string, validators: string[]): Promise<void> {
    const api = await this.getApi();
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
    const api = await this.getApi();
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
    const api = await this.getApi();
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

    const api = await this.getApi();

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
    const api = await this.getApi();
    
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
    const api = await this.getApi();
    const stakingModule = this.getStakingModule(api);

    if (!stakingModule.erasValidatorReward) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.DATA.STAKING_ERROR,
        'The staking module is not available on this chain'
      );
    }

    try {
      const rewards = await Promise.all(
        Array.from({ length: endEra - startEra + 1 }, (_, i) => startEra + i).map(async (era) => {
          try {
            const reward = await stakingModule.erasValidatorReward(era);
            return {
              era,
              reward: reward.toString()
            };
          } catch (error) {
            console.error(`Failed to fetch reward for era ${era}:`, error);
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
    const api = await this.getApi();
    
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
    const api = await this.getApi();
    
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

    const api = await this.getApi();
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
    const api = await this.getApi();
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
    const api = await this.getApi();
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
    const api = await this.getApi();
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

  async bond(account: WalletAccount, amount: string, controller?: string) {
    const api = await this.getApi();
    
    if (!api.tx.staking?.bond) {
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

    return controller
      ? api.tx.staking.bond(controller, amount, 'Staked')
      : api.tx.staking.bond(account.address, amount, 'Staked');
  }

  async nominate(account: WalletAccount, targets: string[]) {
    const api = await this.getApi();
    
    if (!api.tx.staking?.nominate) {
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

    return api.tx.staking.nominate(targets);
  }

  async unbond(account: WalletAccount, amount: string) {
    const api = await this.getApi();
    
    if (!api.tx.staking?.unbond) {
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

    return api.tx.staking.unbond(amount);
  }

  async withdrawUnbonded(account: WalletAccount, numSlashingSpans: number) {
    const api = await this.getApi();
    
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