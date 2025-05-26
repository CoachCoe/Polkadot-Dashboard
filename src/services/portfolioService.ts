import { ApiPromise } from '@polkadot/api';
import { polkadotService } from './polkadot';
import { handleError, PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { formatBalance } from '@polkadot/util';
import type { AccountInfo, AccountData, StakingLedger } from '@polkadot/types/interfaces';
import type { Option } from '@polkadot/types';
import type { Vec } from '@polkadot/types';
import type { BlockNumber } from '@polkadot/types/interfaces/runtime';
import BN from 'bn.js';

// Add logger
const LOG_PREFIX = '[PortfolioService]';
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

export interface PortfolioBalance {
  total: string;
  transferable: string;
  locked: string;
  bonded: string;
  unbonding: string;
  redeemable: string;
  democracy: string;
}

export interface Transaction {
  hash: string;
  type: string;
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  network: string;
}

interface NetworkConfig {
  name: string;
  endpoint: string;
  symbol: string;
  decimals: number;
  subscanEndpoint?: string;
}

const NETWORKS: NetworkConfig[] = [
  {
    name: 'Polkadot',
    endpoint: 'wss://rpc.polkadot.io',
    symbol: 'DOT',
    decimals: 10,
    subscanEndpoint: 'https://polkadot.api.subscan.io'
  },
  {
    name: 'Asset Hub',
    endpoint: 'wss://polkadot-asset-hub-rpc.polkadot.io',
    symbol: 'DOT',
    decimals: 10,
    subscanEndpoint: 'https://assethub-polkadot.api.subscan.io'
  }
  // Add more networks as needed
];

export class PortfolioService {
  private api: ApiPromise | null = null;
  private static instance: PortfolioService;

  private constructor() {
    log.info('Initializing PortfolioService');
  }

  static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  async getApi(): Promise<ApiPromise> {
    try {
      if (!this.api) {
        log.info('Connecting to Polkadot API...');
        this.api = await polkadotService.getApi();
        log.info('Successfully connected to Polkadot API');
      }
      if (!this.api?.isConnected) {
        log.error('API connection check failed');
        throw new PolkadotHubError(
          'Failed to connect to network',
          ErrorCodes.NETWORK.ERROR,
          'Unable to establish connection to the blockchain network.'
        );
      }
      return this.api;
    } catch (error) {
      log.error('Failed to get API connection', error);
      throw handleError(error);
    }
  }

  async getBalance(address: string): Promise<PortfolioBalance> {
    const startTime = Date.now();
    log.info(`Fetching balance for address: ${address}`);

    try {
      const api = await this.getApi();
      if (!api.query.system?.account) {
        log.error('Portfolio API endpoints not available');
        throw new PolkadotHubError(
          'Portfolio API not available',
          ErrorCodes.API.ERROR,
          'The portfolio API endpoints are not available. Please try again.'
        );
      }

      if (!api.query.system.number) {
        throw new PolkadotHubError(
          'System API not available',
          ErrorCodes.API.ERROR,
          'The system API endpoints are not available. Please try again.'
        );
      }

      const [accountInfo, stakingInfo, democracyLocks] = await Promise.all([
        api.query.system.account<AccountInfo>(address),
        api.query.staking?.ledger?.(address) || Promise.resolve(null),
        api.query.democracy?.locks ? 
          api.query.democracy.locks(address).catch(() => api.createType('Vec<()>', [])) :
          Promise.resolve(api.createType('Vec<()>', []))
      ]);

      // Verify account info exists and has required properties
      if (!accountInfo?.data) {
        throw new PolkadotHubError(
          'Invalid account data',
          ErrorCodes.DATA.NOT_FOUND,
          'Could not retrieve account information. Please try again.'
        );
      }

      // Safely log account info with null checks
      log.debug('Account info received', {
        free: accountInfo.data.free?.toString() || '0',
        reserved: accountInfo.data.reserved?.toString() || '0',
        frozen: accountInfo.data.miscFrozen?.toString() || '0'
      });

      const { free = api.createType('Balance', 0), 
              reserved = api.createType('Balance', 0), 
              miscFrozen: frozen = api.createType('Balance', 0) 
            } = accountInfo.data as AccountData;

      try {
        const total = free.add(reserved);
        const transferable = free.sub(frozen);
        const locked = frozen;

        let bonded = '0';
        let unbonding = '0';
        let redeemable = '0';

        if (stakingInfo && !stakingInfo.isEmpty) {
          const ledger = (stakingInfo as Option<StakingLedger>).unwrap();
          bonded = formatBalance(ledger.active || new BN(0), { decimals: 10 });
          log.debug('Staking info received', { bonded });

          if (ledger.unlocking?.length > 0) {
            const currentBlock = await api.query.system.number<BlockNumber>();
            const currentBlockNumber = currentBlock.toBn();

            unbonding = formatBalance(
              ledger.unlocking
                .filter(chunk => chunk?.era?.toBn?.()?.gt?.(currentBlockNumber) ?? false)
                .reduce((acc: BN, chunk) => acc.add(chunk?.value?.toBn?.() || new BN(0)), new BN(0)),
              { decimals: 10 }
            );

            redeemable = formatBalance(
              ledger.unlocking
                .filter(chunk => chunk?.era?.toBn?.()?.lte?.(currentBlockNumber) ?? false)
                .reduce((acc: BN, chunk) => acc.add(chunk?.value?.toBn?.() || new BN(0)), new BN(0)),
              { decimals: 10 }
            );

            log.debug('Unlocking info processed', { unbonding, redeemable });
          }
        }

        const democracyLocksVec = democracyLocks as Vec<any>;
        const democracyLocked = democracyLocksVec && democracyLocksVec.length > 0 && democracyLocksVec[0]?.balance
          ? formatBalance(
              democracyLocksVec
                .reduce((acc: BN, lock) => {
                  const balance = lock?.balance?.toBn?.() || new BN(0);
                  return acc.add(balance);
                }, new BN(0)),
              { decimals: 10 }
            )
          : '0';

        log.debug('Democracy locks processed', { democracyLocked });

        const balance = {
          total: formatBalance(total, { decimals: 10 }),
          transferable: formatBalance(transferable, { decimals: 10 }),
          locked: formatBalance(locked, { decimals: 10 }),
          bonded,
          unbonding,
          redeemable,
          democracy: democracyLocked
        };

        log.info('Balance fetch completed successfully');
        log.performance('getBalance', startTime);

        return balance;
      } catch (error) {
        log.error('Error processing balance data', error);
        throw new PolkadotHubError(
          'Failed to process balance',
          ErrorCodes.DATA.PARSE_ERROR,
          'Error processing account balance data. Please try again.'
        );
      }
    } catch (error) {
      log.error('Failed to fetch balance', error);
      throw new PolkadotHubError(
        'Failed to fetch balance',
        ErrorCodes.DATA.NOT_FOUND,
        'Could not load portfolio balance. Please try again.'
      );
    }
  }

  async getTransactions(address: string, limit = 10): Promise<Transaction[]> {
    const transactions: Transaction[] = [];

    for (const network of NETWORKS) {
      if (!network.subscanEndpoint) continue;

      try {
        const response = await fetch(`${network.subscanEndpoint}/api/v2/scan/transfers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_SUBSCAN_API_KEY || ''
          },
          body: JSON.stringify({
            address,
            row: limit,
            page: 0
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const networkTxs = data.data.transfers.map((tx: any) => ({
          hash: tx.hash,
          type: tx.from === address ? 'send' : 'receive',
          amount: formatBalance(tx.amount, { decimals: network.decimals }),
          from: tx.from,
          to: tx.to,
          timestamp: tx.block_timestamp,
          status: tx.success ? 'success' : 'failed',
          network: network.name
        }));

        transactions.push(...networkTxs);
      } catch (error) {
        console.error(`Error fetching transactions for ${network.name}:`, error);
        // Continue with other networks even if one fails
      }
    }

    // Sort transactions by timestamp (newest first)
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  async disconnect(): Promise<void> {
    try {
      await this.api?.disconnect();
      this.api = null;
    } catch (error) {
      console.error('Error disconnecting from network:', error);
    }
  }
}

export const portfolioService = PortfolioService.getInstance(); 