'use client';

import { polkadotService } from './polkadot';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { websocketService } from './websocketService';
import BN from 'bn.js';
import type { AccountInfo, AccountId } from '@polkadot/types/interfaces';
import type { StakingLedger } from '@polkadot/types/interfaces/staking';
import type { Vec } from '@polkadot/types';
import type { BalanceLock } from '@polkadot/types/interfaces/balances';
import type { Option } from '@polkadot/types';
import { ApiPromise } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';

export interface PortfolioBalance {
  total: string;
  available: string;
  transferable: string;
  locked: string;
  bonded: string;
  unbonding: string;
  redeemable: string;
  democracy: string;
}

export interface CrossChainBalance {
  chain: string;
  balance: string;
  symbol: string;
  price: string;
  value: string;
}

export interface PortfolioStats {
  totalBalance: string;
  change24h: number;
  changePercentage24h: number;
  distribution: {
    relayChain: number;
    assetHub: number;
    parachains: number;
  };
}

export interface ChainBalance {
  chain: string;
  symbol: string;
  balance: string;
  usdValue: string;
  logo: string;
}

export interface Token {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  logo: string;
  chain: string;
}

export interface Transaction {
  hash: string;
  type: 'transfer' | 'staking' | 'governance' | 'cross-chain';
  amount: string;
  timestamp: number;
  from: string;
  to: string;
  status: 'success' | 'pending' | 'failed';
  chain: string;
  blockExplorerUrl: string;
}

interface StakingRewards {
  total: string;
  lastReward: string;
  apr: number;
  nextPayoutDate: number;
}

export interface Validator {
  address: string;
  totalStake: string;
  ownStake: string;
  active: boolean;
}

class PortfolioService {
  private static instance: PortfolioService;
  private api: ApiPromise | null = null;
  private readonly SUBSCAN_API = 'https://polkadot.subscan.io/api/v2';
  private readonly BLOCK_EXPLORER_BASE = 'https://polkadot.subscan.io';

  private constructor() {}

  static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  async init(api: ApiPromise) {
    this.api = api;
  }

  async getBalance(address: string): Promise<PortfolioBalance> {
    try {
      const api = await polkadotService.getApi();
      if (!api?.query?.system?.account || !api?.query?.staking?.ledger || !api?.query?.balances?.locks) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.API.ERROR,
          'API methods not available'
        );
      }

      const [accountData, stakingInfo, locks] = await Promise.all([
        api.query.system.account<AccountInfo>(address),
        api.query.staking.ledger<Option<StakingLedger>>(address),
        api.query.balances.locks<Vec<BalanceLock>>(address)
      ]);

      const { free, reserved, miscFrozen, feeFrozen } = (accountData as any).data;
      const totalLocked = new BN(Math.max(
        miscFrozen.toNumber(),
        feeFrozen.toNumber()
      ));

      const stakingLedger = stakingInfo.unwrapOr(null);
      const bondedBalance = stakingLedger ? new BN(stakingLedger.active.toString()) : new BN(0);
      const unbondingBalance = stakingLedger ? 
        stakingLedger.unlocking.reduce((total: BN, chunk: any) => {
          return total.add(new BN(chunk.value.toString()));
        }, new BN(0)) : new BN(0);

      const democracyLock = locks.find(lock => lock.id.toString() === 'democrac');
      const democracyLocked = democracyLock ? new BN(democracyLock.amount.toString()) : new BN(0);

      return {
        total: free.add(reserved).toString(),
        available: free.sub(totalLocked).toString(),
        transferable: free.sub(totalLocked).toString(),
        locked: totalLocked.toString(),
        bonded: bondedBalance.toString(),
        unbonding: unbondingBalance.toString(),
        redeemable: '0', // TODO: Calculate redeemable amount
        democracy: democracyLocked.toString()
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch balance',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not load account balance. Please try again.'
      );
    }
  }

  async getCrossChainBalances(_address: string): Promise<CrossChainBalance[]> {
    try {
      // TODO: Implement cross-chain balance fetching
      return [];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch cross-chain balances',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not load cross-chain balances. Please try again.'
      );
    }
  }

  async getTransactions(address: string): Promise<Transaction[]> {
    try {
      const api = await polkadotService.getApi();
      if (!api?.query?.system?.events) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      // Get the last 10 transactions
      const events = await api.query.system.events();
      const transactions: Transaction[] = [...(events as any)].filter((event: any) => {
        const { section, method } = event.event;
        return section === 'balances' && (method === 'Transfer' || method === 'Withdraw' || method === 'Deposit');
      })
      .map((event: any) => {
        const [from, to, amount] = event.event.data;
        const type = event.event.method === 'Transfer' 
          ? 'transfer' as const
          : event.event.method === 'Withdraw' 
          ? 'staking' as const 
          : 'transfer' as const;

        return {
          hash: event.hash.toString(),
          type,
          amount: formatBalance(amount, { withUnit: false }),
          timestamp: Date.now(), // TODO: Get actual block timestamp
          from: from.toString(),
          to: to.toString(),
          status: 'success' as const,
          chain: 'Polkadot',
          blockExplorerUrl: `https://polkadot.subscan.io/extrinsic/${event.hash.toString()}`
        };
      })
      .filter((tx: Transaction) => tx.from === address || tx.to === address)
      .slice(0, 10);

      return transactions;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async subscribeToBalanceChanges(
    address: string,
    callback: (balance: string) => void
  ): Promise<() => void> {
    return websocketService.subscribeToBalanceChanges(address, callback);
  }

  async getPortfolioStats(address: string): Promise<PortfolioStats> {
    try {
      if (!this.api?.query?.system?.account) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      // Get balances from different chains
      const [relayBalance, assetHubBalance, parachainBalances] = await Promise.all([
        this.api.query.system.account(address),
        this.getAssetHubBalance(address),
        this.getParachainBalances(address)
      ]);

      const total = (relayBalance as any).data.free.add(assetHubBalance).add(parachainBalances);
      const formattedTotal = formatBalance(total, { withUnit: false });

      // For demo purposes, using static data for 24h changes
      return {
        totalBalance: formattedTotal,
        change24h: 0.5,
        changePercentage24h: 2.5,
        distribution: {
          relayChain: 60,
          assetHub: 30,
          parachains: 10
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMultiChainBalances(_address: string): Promise<ChainBalance[]> {
    try {
      // TODO: Implement actual chain balance fetching
      return [
        {
          chain: 'Polkadot',
          symbol: 'DOT',
          balance: '100',
          usdValue: '500',
          logo: '/images/polkadot.svg'
        },
        {
          chain: 'Asset Hub',
          symbol: 'USDC',
          balance: '500',
          usdValue: '500',
          logo: '/images/usdc.svg'
        }
      ];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch chain balances',
        ErrorCodes.PORTFOLIO.BALANCE_ERROR,
        'Error fetching chain balances'
      );
    }
  }

  async getTokenBalances(_address: string): Promise<Token[]> {
    try {
      // TODO: Implement actual token balance fetching
      return [
        {
          symbol: 'DOT',
          name: 'Polkadot',
          balance: '100',
          usdValue: '500',
          logo: '/images/polkadot.svg',
          chain: 'Relay Chain'
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: '500',
          usdValue: '500',
          logo: '/images/usdc.svg',
          chain: 'Asset Hub'
        },
        {
          symbol: 'HDX',
          name: 'HydraDX',
          balance: '1000',
          usdValue: '100',
          logo: '/images/hydradx.svg',
          chain: 'HydraDX'
        }
      ];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch token balances',
        ErrorCodes.PORTFOLIO.TOKEN_ERROR,
        'Error fetching token balances'
      );
    }
  }

  async getRecentTransactions(address: string): Promise<Transaction[]> {
    try {
      if (!this.api) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const response = await fetch(`${this.SUBSCAN_API}/scan/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          row: 10,
          page: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      return data.data.transfers.map((tx: any) => ({
        hash: tx.hash,
        type: this.determineTransactionType(tx),
        amount: formatBalance(tx.amount, { withUnit: false }),
        timestamp: tx.block_timestamp * 1000,
        from: tx.from,
        to: tx.to,
        status: tx.success ? 'success' : 'failed',
        chain: tx.chain || 'Polkadot',
        blockExplorerUrl: `${this.BLOCK_EXPLORER_BASE}/extrinsic/${tx.hash}`
      }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }

  async getStakingRewards(address: string): Promise<StakingRewards> {
    try {
      if (!this.api) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const api = this.api;

      if (!api.query?.staking) {
        throw new PolkadotHubError(
          'Staking module not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const stakingQuery = api.query.staking;

      if (!stakingQuery?.activeEra || !stakingQuery?.ledger) {
        throw new PolkadotHubError(
          'Required staking queries not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const [_activeEra, stakingLedger] = await Promise.all([
        stakingQuery.activeEra(),
        stakingQuery.ledger(address)
      ]);

      const ledger = (stakingLedger as any)?.unwrap();

      if (!ledger) {
        return {
          total: '0',
          lastReward: '0',
          apr: 0,
          nextPayoutDate: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
        };
      }

      // Calculate total rewards
      const total = ledger.claimedRewards.reduce((acc: BN, era: number) => {
        return acc.add(new BN(era));
      }, new BN(0));

      // Get last reward
      const lastReward = ledger.claimedRewards[ledger.claimedRewards.length - 1] || 0;

      return {
        total: formatBalance(total, { withUnit: false }),
        lastReward: formatBalance(lastReward, { withUnit: false }),
        apr: this.calculateStakingAPR(total),
        nextPayoutDate: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getCurrentEra(): Promise<number> {
    if (!this.api) {
      throw new PolkadotHubError(
        'API not initialized',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const api = this.api;

    if (!api.query?.staking) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const stakingQuery = api.query.staking;

    if (!stakingQuery?.activeEra) {
      throw new PolkadotHubError(
        'Active era query not available',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const activeEra = await stakingQuery.activeEra();
    return (activeEra as any)?.unwrap()?.index?.toNumber() || 0;
  }

  private async getEraTimestamp(era: number): Promise<number> {
    if (!this.api) {
      throw new PolkadotHubError(
        'API not initialized',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const api = this.api;

    if (!api.query?.staking) {
      throw new PolkadotHubError(
        'Staking module not available',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const stakingQuery = api.query.staking;

    if (!stakingQuery?.erasStartSessionIndex) {
      throw new PolkadotHubError(
        'Era start session index query not available',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const timestamp = await stakingQuery.erasStartSessionIndex(era);
    return ((timestamp as any)?.toNumber() || 0) * 6000; // Convert block number to milliseconds
  }

  async getRewardsHistory(address: string): Promise<Array<{
    era: number;
    amount: string;
    timestamp: number;
  }>> {
    try {
      if (!this.api) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const api = this.api;

      if (!api.query?.staking) {
        throw new PolkadotHubError(
          'Staking module not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const stakingQuery = api.query.staking;

      if (!stakingQuery?.erasRewardPoints || !stakingQuery?.erasValidatorReward) {
        throw new PolkadotHubError(
          'Required staking queries not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const erasRewardPoints = stakingQuery.erasRewardPoints;
      const erasValidatorReward = stakingQuery.erasValidatorReward;

      const currentEra = await this.getCurrentEra();
      const historyLength = 30; // Last 30 eras
      const startEra = Math.max(0, currentEra - historyLength);

      const rewards = await Promise.all(
        Array.from({ length: historyLength }, async (_, i) => {
          try {
            const era = startEra + i;
            const [points, reward] = await Promise.all([
              erasRewardPoints(era),
              erasValidatorReward(era)
            ]);

            const validatorPoints = (points as any)?.individual?.get(address) || 0;
            const totalPoints = (points as any)?.total;
            const totalReward = (reward as any)?.unwrapOr(0);

            const amount = (totalPoints as any)?.isZero?.()
              ? '0'
              : totalReward.mul(validatorPoints).div(totalPoints).toString();

            return {
              era,
              amount: formatBalance(amount, { withUnit: false }),
              timestamp: await this.getEraTimestamp(era)
            };
          } catch {
            return null;
          }
        })
      );

      return rewards.filter(Boolean) as Array<{
        era: number;
        amount: string;
        timestamp: number;
      }>;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getValidators(): Promise<Validator[]> {
    try {
      if (!this.api) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const api = this.api;

      if (!api.query?.session || !api.query?.staking) {
        throw new PolkadotHubError(
          'Required modules not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const sessionQuery = api.query.session;
      const stakingQuery = api.query.staking;

      if (!sessionQuery?.validators || !stakingQuery?.erasStakers) {
        throw new PolkadotHubError(
          'Required queries not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const validators = sessionQuery.validators;
      const erasStakers = stakingQuery.erasStakers;

      const [validatorList, era] = await Promise.all([
        validators(),
        this.getCurrentEra()
      ]);

      const validatorAddresses = (validatorList as any).toArray().map((v: AccountId) => v.toString());
      const validatorData = await Promise.all(
        validatorAddresses.map(async (address: string) => {
          try {
            const exposure = await erasStakers(era, address);
            return {
              address,
              totalStake: formatBalance((exposure as any)?.total || 0, { withUnit: false }),
              ownStake: formatBalance((exposure as any)?.own || 0, { withUnit: false }),
              active: true
            };
          } catch {
            return null;
          }
        })
      );

      return validatorData.filter(Boolean) as Validator[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private determineTransactionType(tx: any): Transaction['type'] {
    if (tx.module === 'staking') return 'staking';
    if (tx.module === 'democracy') return 'governance';
    if (tx.module === 'xcm') return 'cross-chain';
    return 'transfer';
  }

  private async getAssetHubBalance(_address: string): Promise<bigint> {
    // Implementation for Asset Hub balance
    return BigInt(0);
  }

  private async getParachainBalances(_address: string): Promise<bigint> {
    // Implementation for parachain balances
    return BigInt(0);
  }

  private calculateStakingAPR(_rewards: any): number {
    // TODO: Implement actual APR calculation
    return 12.5;
  }

  private handleError(error: unknown): never {
    if (error instanceof PolkadotHubError) {
      throw error;
    }

    throw new PolkadotHubError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      ErrorCodes.API.REQUEST_FAILED,
      'Please try again later.'
    );
  }
}

export const portfolioService = PortfolioService.getInstance(); 