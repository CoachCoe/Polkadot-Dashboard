import { ApiPromise, WsProvider } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { StakingLedger, UnlockChunk } from '@polkadot/types/interfaces';
import type { Option } from '@polkadot/types-codec';
import type { Vec } from '@polkadot/types/codec';
import { formatBalance, BN } from '@polkadot/util';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { securityLogger, SecurityEventType } from '@/utils/securityLogger';

// Add consistent logging
const LOG_PREFIX = '[PolkadotApiService]';
const log = {
  info: (message: string, ...args: any[]) => console.log(`${LOG_PREFIX} ${message}`, ...args),
  error: (message: string, error?: any) => console.error(`${LOG_PREFIX} ${message}`, error || ''),
  warn: (message: string, ...args: any[]) => console.warn(`${LOG_PREFIX} ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`${LOG_PREFIX} ${message}`, ...args),
  performance: (operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`${LOG_PREFIX} Performance - ${operation}: ${duration}ms`);
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

export interface WalletAccount {
  address: string;
  name?: string | undefined;
  source: string;
}

export interface ChainInfo {
  name: string;
  tokenSymbol: string;
  tokenDecimals: number;
  ss58Format: number;
}

export interface TransactionStatus {
  status: 'ready' | 'broadcast' | 'inBlock' | 'finalized' | 'error';
  message?: string;
  blockHash?: string;
  txHash?: string;
}

export interface StakingInfo {
  active: string;
  total: string;
  unlocking: Array<{
    value: string;
    era: string;
  }>;
  rewardDestination?: string;
  nominatedValidators?: string[];
}

export interface ValidatorIdentity {
  display?: string;
  web?: string;
  email?: string;
  twitter?: string;
}

export interface ValidatorInfo {
  address: string;
  identity: ValidatorIdentity | undefined;
  commission: string;
  totalStake: string;
  ownStake: string;
  nominators: number;
  blocked: boolean;
}

class PolkadotApiService {
  private static instance: PolkadotApiService;
  private api: ApiPromise | null = null;
  private wsEndpoint: string;
  private chainInfo: ChainInfo | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 5000; // 5 seconds

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
        log.debug('Already connected to Polkadot network');
        return this.api;
      }

      log.info('Connecting to Polkadot network...');
      const provider = new WsProvider(this.wsEndpoint);
      this.api = await ApiPromise.create({ provider, noInitWarn: true });

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
      // Dynamically import extension-dapp
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');

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
            const account: WalletAccount = {
              address: acc.address,
              name: acc.meta.name,
              source: acc.meta.source
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
        errorMessage,
        ErrorCodes.WALLET.CONNECTION_ERROR,
        'Failed to initialize wallet'
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

  async getStakingInfo(address: string): Promise<StakingInfo | null> {
    try {
      const api = await this.getApi();
      if (!api.query.staking?.ledger || !api.query.staking?.nominators || !api.query.staking?.payee) {
        throw new Error('Staking queries not available');
      }

      const stakingLedger = await api.query.staking.ledger<Option<StakingLedger>>(address);
      
      if (!stakingLedger.isSome) return null;

      const ledger = stakingLedger.unwrap();
      const nominations = await api.query.staking.nominators(address) as Option<any>;
      const payee = await api.query.staking.payee(address);

      return {
        active: formatBalance(ledger.active, { withUnit: false }),
        total: formatBalance(ledger.total, { withUnit: false }),
        unlocking: ledger.unlocking.map((chunk: UnlockChunk) => ({
          value: formatBalance(chunk.value, { withUnit: false }),
          era: chunk.era.toString()
        })),
        rewardDestination: payee.toString(),
        nominatedValidators: nominations.isSome ? nominations.unwrap().targets.map((v: any) => v.toString()) : []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to get staking information:', error);
      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to get staking information'
      );
    }
  }

  async getValidators(): Promise<ValidatorInfo[]> {
    const startTime = Date.now();
    log.info('Fetching validator information...');

    try {
      const api = await this.getApi();
      const queries = api.query;
      
      if (!queries.session?.validators || !queries.staking?.activeEra || 
          !queries.staking?.validators || !queries.staking?.erasStakers || 
          !queries.identity?.identityOf) {
        throw new PolkadotHubError(
          'Required queries not available',
          ErrorCodes.API.ERROR,
          'Cannot fetch validator information'
        );
      }

      // Create type-safe query objects
      const sessionQueries = {
        validators: queries.session.validators.bind(queries.session)
      };

      const stakingQueries = {
        activeEra: queries.staking.activeEra.bind(queries.staking),
        validators: queries.staking.validators.bind(queries.staking),
        erasStakers: queries.staking.erasStakers.bind(queries.staking)
      };

      const identityQueries = {
        identityOf: queries.identity.identityOf.bind(queries.identity)
      };

      // Get current validators and era
      const [validators, eraResult] = await Promise.all([
        sessionQueries.validators(),
        stakingQueries.activeEra()
      ]);

      const era = (eraResult.toJSON() as { index: number } | null);
      if (!era) {
        throw new PolkadotHubError(
          'Cannot determine current era',
          ErrorCodes.API.ERROR,
          'Failed to get current era information'
        );
      }

      const validatorAddresses = (validators as Vec<any>).map((v: any) => v.toString());
      log.debug(`Found ${validatorAddresses.length} active validators`);

      // Fetch validator details in batches to avoid overwhelming the node
      const batchSize = 50;
      const validatorInfos: ValidatorInfo[] = [];

      for (let i = 0; i < validatorAddresses.length; i += batchSize) {
        const batch = validatorAddresses.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (address: string) => {
            try {
              const [prefs, exposure, identity] = await Promise.all([
                stakingQueries.validators(address),
                stakingQueries.erasStakers(era.index, address),
                identityQueries.identityOf(address)
              ]);

              const prefsJson = prefs.toJSON() as { commission: number; blocked: boolean };
              const exposureJson = exposure.toJSON() as { total: string; own: string; others: any[] };
              const validatorIdentity = this.parseIdentity(identity);

              const validatorInfo: ValidatorInfo = {
                address,
                identity: validatorIdentity,
                commission: prefsJson.commission.toString(),
                totalStake: formatBalance(exposureJson.total, { withUnit: false }),
                ownStake: formatBalance(exposureJson.own, { withUnit: false }),
                nominators: exposureJson.others.length,
                blocked: prefsJson.blocked
              };

              return validatorInfo;
            } catch (error) {
              log.warn(`Failed to fetch details for validator ${address}:`, error);
              return null;
            }
          })
        );

        const validResults = batchResults.filter((info): info is ValidatorInfo => info !== null);
        validatorInfos.push(...validResults);
        log.debug(`Processed ${i + batch.length}/${validatorAddresses.length} validators`);
      }

      log.info(`Successfully fetched information for ${validatorInfos.length} validators`);
      log.performance('Validator information retrieval', startTime);

      return validatorInfos;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to get validator information:', error);

      if (error instanceof PolkadotHubError) {
        throw error;
      }

      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to fetch validator information'
      );
    }
  }

  private parseIdentity(identity: any): ValidatorIdentity | undefined {
    if (!identity || !identity.isSome) {
      return undefined;
    }

    try {
      const info = identity.unwrap().info;
      return {
        display: info.display.isRaw ? info.display.asRaw.toHuman() : undefined,
        web: info.web.isRaw ? info.web.asRaw.toHuman() : undefined,
        email: info.email.isRaw ? info.email.asRaw.toHuman() : undefined,
        twitter: info.twitter.isRaw ? info.twitter.asRaw.toHuman() : undefined
      };
    } catch (error) {
      log.warn('Failed to parse validator identity:', error);
      return undefined;
    }
  }

  async stake(
    address: string,
    amount: string,
    validators: string[],
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<void> {
    const startTime = Date.now();
    log.info(`Initiating staking operation for address: ${address}`);

    try {
      // Validate inputs
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new PolkadotHubError(
          'Invalid staking amount',
          ErrorCodes.VALIDATION.INVALID_AMOUNT,
          'Staking amount must be a positive number'
        );
      }

      if (!validators || validators.length === 0) {
        throw new PolkadotHubError(
          'No validators specified',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'At least one validator must be selected'
        );
      }

      const api = await this.getApi();
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(address);
      
      if (!api.tx.staking?.bond || !api.tx.staking?.nominate || !api.tx.utility?.batch) {
        throw new PolkadotHubError(
          'Required transactions not available',
          ErrorCodes.API.ERROR,
          'Staking functionality is not available'
        );
      }

      // Validate minimum staking amount
      if (!api.consts.staking?.minNominatorBond) {
        throw new PolkadotHubError(
          'Cannot determine minimum staking amount',
          ErrorCodes.API.ERROR,
          'Required staking constants not available'
        );
      }

      const minimumStake = api.consts.staking.minNominatorBond;
      const minimumStakeBN = new BN(minimumStake.toHex());
      if (new BN(amount).lt(minimumStakeBN)) {
        throw new PolkadotHubError(
          'Insufficient staking amount',
          ErrorCodes.VALIDATION.INVALID_AMOUNT,
          `Minimum staking amount is ${formatBalance(minimumStakeBN)}`
        );
      }

      // Validate validators
      const validatorSet = new Set(validators);
      if (validatorSet.size !== validators.length) {
        throw new PolkadotHubError(
          'Duplicate validators',
          ErrorCodes.VALIDATION.INVALID_PARAMETER,
          'Validator list contains duplicates'
        );
      }

      // Create and submit the batch transaction
      const bondTx = api.tx.staking.bond(amount, 'Staked');
      const nominateTx = api.tx.staking.nominate(Array.from(validatorSet));
      const batch = api.tx.utility.batch([bondTx, nominateTx]);

      log.info('Submitting staking transaction...');
      await this.signAndSend(batch, address, injector.signer, onStatusChange);
      log.performance('Staking operation', startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to stake tokens:', error);

      if (error instanceof PolkadotHubError) {
        throw error;
      }

      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to stake tokens'
      );
    }
  }

  async unstake(
    address: string,
    amount: string,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<void> {
    const startTime = Date.now();
    log.info(`Initiating unstaking operation for address: ${address}`);

    try {
      // Validate amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new PolkadotHubError(
          'Invalid unstaking amount',
          ErrorCodes.VALIDATION.INVALID_AMOUNT,
          'Unstaking amount must be a positive number'
        );
      }

      const api = await this.getApi();
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(address);
      
      if (!api.tx.staking?.unbond) {
        throw new PolkadotHubError(
          'Required transactions not available',
          ErrorCodes.API.ERROR,
          'Unstaking functionality is not available'
        );
      }

      // Get current bonded balance
      const stakingInfo = await this.getStakingInfo(address);
      if (!stakingInfo || !stakingInfo.active) {
        throw new PolkadotHubError(
          'No active stake',
          ErrorCodes.VALIDATION.INVALID_STATE,
          'No active stake found for this address'
        );
      }

      const activeStake = new BN(stakingInfo.active);
      const unstakeAmount = new BN(amount);

      if (unstakeAmount.gt(activeStake)) {
        throw new PolkadotHubError(
          'Insufficient staked balance',
          ErrorCodes.VALIDATION.INVALID_AMOUNT,
          `Cannot unstake more than the active stake: ${formatBalance(activeStake)}`
        );
      }

      log.info('Submitting unstaking transaction...');
      const tx = api.tx.staking.unbond(amount);
      await this.signAndSend(tx, address, injector.signer, onStatusChange);
      log.performance('Unstaking operation', startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to unstake tokens:', error);

      if (error instanceof PolkadotHubError) {
        throw error;
      }

      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to unstake tokens'
      );
    }
  }

  async withdrawUnbonded(
    address: string,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<void> {
    const startTime = Date.now();
    log.info(`Initiating withdrawal of unbonded tokens for address: ${address}`);

    try {
      const api = await this.getApi();
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(address);
      
      if (!api.tx.staking?.withdrawUnbonded || !api.query.staking?.activeEra) {
        throw new PolkadotHubError(
          'Required transactions not available',
          ErrorCodes.API.ERROR,
          'Withdrawal functionality is not available'
        );
      }

      // Check if there are any unbonded funds
      const stakingInfo = await this.getStakingInfo(address);
      if (!stakingInfo || !stakingInfo.unlocking || stakingInfo.unlocking.length === 0) {
        throw new PolkadotHubError(
          'No unbonded funds',
          ErrorCodes.VALIDATION.INVALID_STATE,
          'No unbonded funds available for withdrawal'
        );
      }

      // Get current era
      const activeEraResult = await api.query.staking.activeEra();
      const activeEra = activeEraResult.toJSON() as { index: number } | null;
      
      if (!activeEra) {
        throw new PolkadotHubError(
          'Cannot determine current era',
          ErrorCodes.API.ERROR,
          'Failed to get current era information'
        );
      }

      const currentEra = activeEra.index;
      const hasWithdrawableUnlocks = stakingInfo.unlocking.some(chunk => 
        Number(chunk.era) <= currentEra
      );

      if (!hasWithdrawableUnlocks) {
        throw new PolkadotHubError(
          'No withdrawable funds',
          ErrorCodes.VALIDATION.INVALID_STATE,
          'No unbonded funds are currently available for withdrawal'
        );
      }

      log.info('Submitting withdrawal transaction...');
      const tx = api.tx.staking.withdrawUnbonded(0);
      await this.signAndSend(tx, address, injector.signer, onStatusChange);
      log.performance('Withdrawal operation', startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Failed to withdraw unbonded tokens:', error);

      if (error instanceof PolkadotHubError) {
        throw error;
      }

      throw new PolkadotHubError(
        errorMessage,
        ErrorCodes.API.ERROR,
        'Failed to withdraw unbonded tokens'
      );
    }
  }

  private async signAndSend(
    tx: SubmittableExtrinsic<'promise'>,
    address: string,
    signer: Signer,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<void> {
    const startTime = Date.now();
    log.info('Signing and sending transaction...');

    if (!this.api) {
      throw new PolkadotHubError(
        'API not initialized',
        ErrorCodes.API.ERROR,
        'Cannot send transaction without API connection'
      );
    }

    const api = this.api; // Create a stable reference
    const systemEvents = api.events?.system;

    if (!systemEvents?.ExtrinsicSuccess) {
      throw new PolkadotHubError(
        'Required API events not available',
        ErrorCodes.API.ERROR,
        'Cannot monitor transaction status without system events'
      );
    }

    // Create a stable reference to the ExtrinsicSuccess event
    const extrinsicSuccess = systemEvents.ExtrinsicSuccess;

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer }, ({ status, dispatchError, events }) => {
        try {
          if (status.isReady) {
            log.debug('Transaction is ready to be broadcast');
            onStatusChange?.({ status: 'ready' });
          } else if (status.isBroadcast) {
            log.debug('Transaction has been broadcast');
            onStatusChange?.({ status: 'broadcast' });
          } else if (status.isInBlock) {
            const blockHash = status.asInBlock.toHex();
            log.debug(`Transaction included in block: ${blockHash}`);
            onStatusChange?.({
              status: 'inBlock',
              blockHash
            });
          } else if (status.isFinalized) {
            const blockHash = status.asFinalized.toHex();
            
            if (dispatchError) {
              const errorMessage = dispatchError.isModule 
                ? `Module Error: ${dispatchError.asModule.toString()}`
                : dispatchError.toString();
              
              log.error(`Transaction failed: ${errorMessage}`);
              onStatusChange?.({
                status: 'error',
                message: errorMessage,
                blockHash
              });
              reject(new PolkadotHubError(
                errorMessage,
                ErrorCodes.API.ERROR,
                'Transaction failed after finalization'
              ));
            } else {
              // Process events to ensure transaction success
              const success = events.some(({ event }) => extrinsicSuccess.is(event));

              if (success) {
                log.info(`Transaction finalized in block: ${blockHash}`);
                log.performance('Transaction completion', startTime);
                onStatusChange?.({
                  status: 'finalized',
                  blockHash
                });
                resolve();
              } else {
                const errorMessage = 'Transaction finalized but no success event found';
                log.error(errorMessage);
                onStatusChange?.({
                  status: 'error',
                  message: errorMessage,
                  blockHash
                });
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
          onStatusChange?.({
            status: 'error',
            message: errorMessage
          });
          reject(new PolkadotHubError(
            errorMessage,
            ErrorCodes.API.ERROR,
            'Error processing transaction status'
          ));
        }
      }).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error('Transaction submission failed:', error);
        onStatusChange?.({
          status: 'error',
          message: errorMessage
        });
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
}

export default PolkadotApiService.getInstance();