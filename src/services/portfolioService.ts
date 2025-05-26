import { polkadotService } from './polkadot';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { websocketService } from './websocketService';
import BN from 'bn.js';
import type { AccountInfo } from '@polkadot/types/interfaces';
import type { StakingLedger } from '@polkadot/types/interfaces/staking';
import type { Vec } from '@polkadot/types';
import type { BalanceLock } from '@polkadot/types/interfaces/balances';
import type { Option } from '@polkadot/types';

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
  id: string;
  type: 'send' | 'receive' | 'swap' | 'bridge';
  amount: string;
  symbol: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  from: string;
  to: string;
  chain: string;
}

class PortfolioService {
  private static instance: PortfolioService;
  private constructor() {}

  static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  async getBalance(address: string): Promise<PortfolioBalance> {
    try {
      const api = await polkadotService.getApi();
      if (!api?.query?.system?.account || !api?.query?.staking?.ledger || !api?.query?.balances?.locks) {
        throw new PolkadotHubError(
          'API not ready',
          ErrorCodes.API.REQUEST_FAILED,
          'API methods not available'
        );
      }

      const [accountData, stakingInfo, locks] = await Promise.all([
        api.query.system.account<AccountInfo>(address),
        api.query.staking.ledger<Option<StakingLedger>>(address),
        api.query.balances.locks<Vec<BalanceLock>>(address)
      ]);

      const { free, reserved, miscFrozen, feeFrozen } = accountData.data;
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
      // TODO: Implement actual transaction fetching
      return [
        {
          id: '1',
          type: 'send',
          amount: '50',
          symbol: 'DOT',
          timestamp: new Date().toISOString(),
          status: 'completed',
          from: address,
          to: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          chain: 'Relay Chain'
        },
        {
          id: '2',
          type: 'receive',
          amount: '100',
          symbol: 'USDC',
          timestamp: new Date().toISOString(),
          status: 'completed',
          from: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          to: address,
          chain: 'Asset Hub'
        },
        {
          id: '3',
          type: 'bridge',
          amount: '25',
          symbol: 'DOT',
          timestamp: new Date().toISOString(),
          status: 'pending',
          from: address,
          to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          chain: 'Bridge to Ethereum'
        }
      ];
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch transactions',
        ErrorCodes.PORTFOLIO.TRANSACTION_ERROR,
        'Error fetching transactions'
      );
    }
  }

  async subscribeToBalanceChanges(
    address: string,
    callback: (balance: string) => void
  ): Promise<() => void> {
    return websocketService.subscribeToBalanceChanges(address, callback);
  }

  async getPortfolioStats(_address: string): Promise<PortfolioStats> {
    try {
      // TODO: Implement actual portfolio stats fetching
      return {
        totalBalance: '1000',
        change24h: 50,
        changePercentage24h: 5,
        distribution: {
          relayChain: 60,
          assetHub: 30,
          parachains: 10
        }
      };
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to fetch portfolio stats',
        ErrorCodes.PORTFOLIO.STATS_ERROR,
        'Error fetching portfolio statistics'
      );
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
}

export const portfolioService = PortfolioService.getInstance(); 