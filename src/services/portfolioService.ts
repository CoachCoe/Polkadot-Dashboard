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
import { ApiPromise, WsProvider } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';

export interface PortfolioBalance {
  total: string;
  available: string;
  transferable: string;
  locked: {
    total: string;
    staking: string;
    democracy: string;
    vesting: string;
    governance: string;
  };
  bonded: string;
  unbonding: string;
  redeemable: string;
}

export interface CrossChainBalance {
  chain: string;
  symbol: string;
  balance: string;
  value: string;
  usdValue: string;
  logo: string;
  locked?: string;
  explorerUrl?: string;
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
  balanceDetails: {
    available: string;
    locked: string;
    bonded: string;
    unbonding: string;
    democracy: string;
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

      // Parse different types of locks
      const democracyLock = locks.find(lock => lock.id.toString() === 'democrac');
      const vestingLock = locks.find(lock => lock.id.toString() === 'vesting');
      const governanceLock = locks.find(lock => lock.id.toString() === 'governan');

      const democracyLocked = democracyLock ? new BN(democracyLock.amount.toString()) : new BN(0);
      const vestingLocked = vestingLock ? new BN(vestingLock.amount.toString()) : new BN(0);
      const governanceLocked = governanceLock ? new BN(governanceLock.amount.toString()) : new BN(0);

      return {
        total: free.add(reserved).toString(),
        available: free.sub(totalLocked).toString(),
        transferable: free.sub(totalLocked).toString(),
        locked: {
          total: totalLocked.toString(),
          staking: bondedBalance.toString(),
          democracy: democracyLocked.toString(),
          vesting: vestingLocked.toString(),
          governance: governanceLocked.toString()
        },
        bonded: bondedBalance.toString(),
        unbonding: unbondingBalance.toString(),
        redeemable: '0' // TODO: Calculate redeemable amount
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
      const balance = await this.getBalance(address);
      
      // Convert string balances to BigInt for calculations
      const relayChainTotal = BigInt(balance.total || 0);
      const assetHubTotal = BigInt(0); // TODO: Implement actual Asset Hub balance
      const parachainsTotal = BigInt(0); // TODO: Implement actual parachain balances
      
      const totalValue = relayChainTotal + assetHubTotal + parachainsTotal;
      
      // Calculate percentages
      const relayChainPercentage = totalValue === BigInt(0) ? 0 :
        Number((BigInt(100) * relayChainTotal) / totalValue);
      const assetHubPercentage = totalValue === BigInt(0) ? 0 :
        Number((BigInt(100) * assetHubTotal) / totalValue);
      const parachainsPercentage = totalValue === BigInt(0) ? 0 :
        Number((BigInt(100) * parachainsTotal) / totalValue);

      // Mock 24h change data for now
      // TODO: Implement real price change tracking
      const mockChange = Math.random() * 10 - 5; // Random number between -5 and 5

      return {
        totalBalance: balance.total,
        change24h: mockChange,
        changePercentage24h: mockChange,
        distribution: {
          relayChain: relayChainPercentage,
          assetHub: assetHubPercentage,
          parachains: parachainsPercentage
        },
        balanceDetails: {
          available: balance.available,
          locked: balance.locked.total,
          bonded: balance.bonded,
          unbonding: balance.unbonding,
          democracy: balance.locked.democracy
        }
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch portfolio stats',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not load portfolio statistics. Please try again.'
      );
    }
  }

  async getMultiChainBalances(address: string): Promise<CrossChainBalance[]> {
    try {
      const api = await polkadotService.getApi();
      if (!api) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.API.ERROR,
          'API methods not available'
        );
      }

      // Fetch balances from different chains
      const [assetHubBalance, acalaBalance, moonbeamBalance, astarBalance] = await Promise.all([
        this.getAssetHubBalance(address),
        this.getAcalaBalance(address),
        this.getMoonbeamBalance(address),
        this.getAstarBalance(address)
      ]);

      return [
        {
          chain: 'Asset Hub',
          symbol: 'DOT',
          balance: assetHubBalance.total,
          value: '0', // TODO: Implement price fetching
          usdValue: '0',
          logo: '/images/chains/asset-hub.svg',
          locked: assetHubBalance.locked?.total,
          explorerUrl: `https://assethub.subscan.io/account/${address}`
        },
        {
          chain: 'Acala',
          symbol: 'ACA',
          balance: acalaBalance.total,
          value: '0',
          usdValue: '0',
          logo: '/images/chains/acala.svg',
          locked: acalaBalance.locked?.total,
          explorerUrl: `https://acala.subscan.io/account/${address}`
        },
        {
          chain: 'Moonbeam',
          symbol: 'GLMR',
          balance: moonbeamBalance.total,
          value: '0',
          usdValue: '0',
          logo: '/images/chains/moonbeam.svg',
          locked: moonbeamBalance.locked?.total,
          explorerUrl: `https://moonbeam.subscan.io/account/${address}`
        },
        {
          chain: 'Astar',
          symbol: 'ASTR',
          balance: astarBalance.total,
          value: '0',
          usdValue: '0',
          logo: '/images/chains/astar.svg',
          locked: astarBalance.locked?.total,
          explorerUrl: `https://astar.subscan.io/account/${address}`
        }
      ].filter(balance => balance.balance !== '0');
    } catch (error) {
      console.error('Failed to fetch multi-chain balances:', error);
      throw new PolkadotHubError(
        'Failed to fetch multi-chain balances',
        ErrorCodes.API.REQUEST_FAILED,
        'Could not load cross-chain balances. Please try again.'
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

      // Fetch transactions from multiple sources
      const [relayChainTxs, assetHubTxs, acalaTxs] = await Promise.all([
        this.getRelayChainTransactions(address),
        this.getAssetHubTransactions(address),
        this.getAcalaTransactions(address)
      ]);

      // Combine and sort transactions by timestamp
      const allTransactions = [...relayChainTxs, ...assetHubTxs, ...acalaTxs]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50); // Limit to 50 most recent transactions

      return allTransactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }

  private async getRelayChainTransactions(address: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.SUBSCAN_API}/scan/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          row: 20,
          page: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch relay chain transactions');
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
        chain: 'Polkadot',
        blockExplorerUrl: `${this.BLOCK_EXPLORER_BASE}/extrinsic/${tx.hash}`
      }));
    } catch (error) {
      console.error('Failed to fetch relay chain transactions:', error);
      return [];
    }
  }

  private async getAssetHubTransactions(address: string): Promise<Transaction[]> {
    try {
      const response = await fetch('https://assethub.subscan.io/api/v2/scan/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          row: 20,
          page: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Asset Hub transactions');
      }

      const data = await response.json();
      return data.data.transfers.map((tx: any) => ({
        hash: tx.hash,
        type: 'transfer',
        amount: formatBalance(tx.amount, { withUnit: false }),
        timestamp: tx.block_timestamp * 1000,
        from: tx.from,
        to: tx.to,
        status: tx.success ? 'success' : 'failed',
        chain: 'Asset Hub',
        blockExplorerUrl: `https://assethub.subscan.io/extrinsic/${tx.hash}`
      }));
    } catch (error) {
      console.error('Failed to fetch Asset Hub transactions:', error);
      return [];
    }
  }

  private async getAcalaTransactions(address: string): Promise<Transaction[]> {
    try {
      const response = await fetch('https://acala.subscan.io/api/v2/scan/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          row: 20,
          page: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Acala transactions');
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
        chain: 'Acala',
        blockExplorerUrl: `https://acala.subscan.io/extrinsic/${tx.hash}`
      }));
    } catch (error) {
      console.error('Failed to fetch Acala transactions:', error);
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

  private async getAssetHubBalance(address: string): Promise<PortfolioBalance> {
    try {
      // Connect to Asset Hub
      const wsProvider = new WsProvider('wss://polkadot-asset-hub-rpc.polkadot.io');
      const api = await ApiPromise.create({ provider: wsProvider });

      if (!api.query?.system?.account || !api.query?.balances?.locks) {
        throw new Error('Required API methods not available');
      }

      const [accountData, locks] = await Promise.all([
        api.query.system.account(address),
        api.query.balances.locks(address)
      ]);

      const { free, reserved, miscFrozen, feeFrozen } = (accountData as any).data;
      const totalLocked = new BN(Math.max(
        miscFrozen.toNumber(),
        feeFrozen.toNumber()
      ));

      // Parse different types of locks
      const locksArray = (locks as unknown as Vec<BalanceLock>).toArray();
      const democracyLock = locksArray.find(lock => lock.id.toString() === 'democrac');
      const vestingLock = locksArray.find(lock => lock.id.toString() === 'vesting');
      const governanceLock = locksArray.find(lock => lock.id.toString() === 'governan');

      const democracyLocked = democracyLock ? new BN(democracyLock.amount.toString()) : new BN(0);
      const vestingLocked = vestingLock ? new BN(vestingLock.amount.toString()) : new BN(0);
      const governanceLocked = governanceLock ? new BN(governanceLock.amount.toString()) : new BN(0);

      await api.disconnect();

      return {
        total: free.add(reserved).toString(),
        available: free.sub(totalLocked).toString(),
        transferable: free.sub(totalLocked).toString(),
        locked: {
          total: totalLocked.toString(),
          staking: '0', // Asset Hub doesn't have staking
          democracy: democracyLocked.toString(),
          vesting: vestingLocked.toString(),
          governance: governanceLocked.toString()
        },
        bonded: '0',
        unbonding: '0',
        redeemable: '0'
      };
    } catch (error) {
      console.error('Failed to fetch Asset Hub balance:', error);
      return {
        total: '0',
        available: '0',
        transferable: '0',
        locked: {
          total: '0',
          staking: '0',
          democracy: '0',
          vesting: '0',
          governance: '0'
        },
        bonded: '0',
        unbonding: '0',
        redeemable: '0'
      };
    }
  }

  private async getAcalaBalance(address: string): Promise<PortfolioBalance> {
    try {
      // Connect to Acala
      const wsProvider = new WsProvider('wss://acala-rpc-0.aca-api.network');
      const api = await ApiPromise.create({ provider: wsProvider });

      if (!api.query?.system?.account || !api.query?.balances?.locks) {
        throw new Error('Required API methods not available');
      }

      const [accountData, locks] = await Promise.all([
        api.query.system.account(address),
        api.query.balances.locks(address)
      ]);

      const { free, reserved, miscFrozen, feeFrozen } = (accountData as any).data;
      const totalLocked = new BN(Math.max(
        miscFrozen.toNumber(),
        feeFrozen.toNumber()
      ));

      // Parse different types of locks
      const locksArray = (locks as unknown as Vec<BalanceLock>).toArray();
      const democracyLock = locksArray.find(lock => lock.id.toString() === 'democrac');
      const vestingLock = locksArray.find(lock => lock.id.toString() === 'vesting');
      const governanceLock = locksArray.find(lock => lock.id.toString() === 'governan');

      const democracyLocked = democracyLock ? new BN(democracyLock.amount.toString()) : new BN(0);
      const vestingLocked = vestingLock ? new BN(vestingLock.amount.toString()) : new BN(0);
      const governanceLocked = governanceLock ? new BN(governanceLock.amount.toString()) : new BN(0);

      await api.disconnect();

      return {
        total: free.add(reserved).toString(),
        available: free.sub(totalLocked).toString(),
        transferable: free.sub(totalLocked).toString(),
        locked: {
          total: totalLocked.toString(),
          staking: '0',
          democracy: democracyLocked.toString(),
          vesting: vestingLocked.toString(),
          governance: governanceLocked.toString()
        },
        bonded: '0',
        unbonding: '0',
        redeemable: '0'
      };
    } catch (error) {
      console.error('Failed to fetch Acala balance:', error);
      return {
        total: '0',
        available: '0',
        transferable: '0',
        locked: {
          total: '0',
          staking: '0',
          democracy: '0',
          vesting: '0',
          governance: '0'
        },
        bonded: '0',
        unbonding: '0',
        redeemable: '0'
      };
    }
  }

  private async getMoonbeamBalance(_address: string): Promise<PortfolioBalance> {
    // TODO: Implement actual Moonbeam balance fetching
    return {
      total: '0',
      available: '0',
      transferable: '0',
      locked: {
        total: '0',
        staking: '0',
        democracy: '0',
        vesting: '0',
        governance: '0'
      },
      bonded: '0',
      unbonding: '0',
      redeemable: '0'
    };
  }

  private async getAstarBalance(_address: string): Promise<PortfolioBalance> {
    // TODO: Implement actual Astar balance fetching
    return {
      total: '0',
      available: '0',
      transferable: '0',
      locked: {
        total: '0',
        staking: '0',
        democracy: '0',
        vesting: '0',
        governance: '0'
      },
      bonded: '0',
      unbonding: '0',
      redeemable: '0'
    };
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