'use client';

import { ApiPromise } from '@polkadot/api';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';
import { formatBalance } from '@polkadot/util';
import type { Option } from '@polkadot/types';
import type { IdentityInfo } from '@polkadot/types/interfaces/identity';
import type { Codec } from '@polkadot/types-codec/types';
import type { AccountId } from '@polkadot/types/interfaces/runtime';

// Type interfaces for internal use
interface StakingExposure extends Codec {
  total: Codec;
  own: Codec;
  others: Array<{
    who: AccountId;
    value: Codec;
  }>;
}

interface StakingEraPoints extends Codec {
  individual: Map<string, number>;
  total: Codec;
}

interface StakingLedgerType extends Codec {
  stash: AccountId;
  total: Codec;
  active: Codec;
  unlocking: Array<{
    value: Codec;
    era: Codec & { toNumber: () => number };
  }>;
  claimedRewards: number[];
  unwrap: () => StakingLedgerType;
}

export interface ValidatorAnalytics {
  address: string;
  identity: {
    display: string;
    web: string;
    email: string;
    twitter: string;
  };
  commission: number;
  totalStake: string;
  ownStake: string;
  nominators: number;
  blocksProduced: number;
  era: {
    points: number;
    rewards: string;
  };
  performance: {
    uptime: number;
    slashes: number;
  };
}

export interface NominationPool {
  id: number;
  name: string;
  members: number;
  totalStaked: string;
  rewardRate: number;
  commission: number;
  validators: string[];
}

export interface StakingHistory {
  era: number;
  reward: string;
  timestamp: number;
  validators: Array<{
    address: string;
    amount: string;
  }>;
}

export interface StakingDuration {
  startDate: number;
  totalDays: number;
  unbondingPeriods: Array<{
    amount: string;
    unlockDate: number;
  }>;
  rewardFrequency: number;
}

export interface Validator {
  address: string;
  totalStake: string;
  ownStake: string;
  active: boolean;
}

class StakingService {
  private api: ApiPromise | null = null;

  async init(api: ApiPromise) {
    this.api = api;
  }

  async getValidatorAnalytics(validatorAddress: string): Promise<ValidatorAnalytics> {
    try {
      if (!this.api?.query?.identity || !this.api?.query?.staking) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const api = this.api;
      const currentEra = await this.getCurrentEra();

      // Ensure all required queries exist
      const identityQuery = api.query.identity;
      const stakingQuery = api.query.staking;

      if (!identityQuery?.identityOf || !stakingQuery?.validators || !stakingQuery?.erasStakers || !stakingQuery?.erasRewardPoints || !stakingQuery?.slashingSpans) {
        throw new PolkadotHubError(
          'Required queries not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const [identity, prefs, exposure, eraPoints, slashes] = await Promise.all([
        identityQuery.identityOf(validatorAddress),
        stakingQuery.validators(validatorAddress),
        stakingQuery.erasStakers(currentEra, validatorAddress),
        stakingQuery.erasRewardPoints(currentEra),
        stakingQuery.slashingSpans(validatorAddress)
      ]);

      const identityData = (identity as Option<IdentityInfo>)?.unwrapOr(null);
      const validatorPoints = (eraPoints as any)?.individual?.get(validatorAddress) || 0;

      return {
        address: validatorAddress,
        identity: {
          display: (identityData as any)?.display?.toString() || 'Unknown',
          web: (identityData as any)?.web?.toString() || '',
          email: (identityData as any)?.email?.toString() || '',
          twitter: (identityData as any)?.twitter?.toString() || ''
        },
        commission: (prefs as any)?.commission?.toNumber() / 10_000_000 || 0,
        totalStake: formatBalance((exposure as any)?.total || 0, { withUnit: false }),
        ownStake: formatBalance((exposure as any)?.own || 0, { withUnit: false }),
        nominators: (exposure as any)?.others?.length || 0,
        blocksProduced: (validatorPoints as any)?.toNumber() || 0,
        era: {
          points: (validatorPoints as any)?.toNumber() || 0,
          rewards: await this.calculateEraRewards(validatorAddress)
        },
        performance: {
          uptime: 99.9, // TODO: Calculate actual uptime
          slashes: (slashes as any)?.prior?.length || 0
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getNominationPools(): Promise<NominationPool[]> {
    try {
      if (!this.api?.query?.nominationPools) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const nominationPoolsQuery = this.api.query.nominationPools;

      if (!nominationPoolsQuery?.counterForPoolId || !nominationPoolsQuery?.metadata || !nominationPoolsQuery?.bondedPools || !nominationPoolsQuery?.poolMembers || !nominationPoolsQuery?.rewardPools) {
        throw new PolkadotHubError(
          'Nomination pools query not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const poolCount = await nominationPoolsQuery.counterForPoolId();
      const pools: (Codec | null)[] = [];
      
      for (let i = 0; i < (poolCount as any).toNumber(); i++) {
        try {
          const metadata = await nominationPoolsQuery.metadata(i);
          pools.push(metadata);
        } catch {
          pools.push(null);
        }
      }

      const poolsData = await Promise.all(
        pools.filter(Boolean).map(async (metadata, id) => {
          try {
            if (!nominationPoolsQuery.bondedPools || !nominationPoolsQuery.poolMembers || !nominationPoolsQuery.rewardPools) {
              return null;
            }

            const [bondedPools, poolMembers, rewardPool] = await Promise.all([
              nominationPoolsQuery.bondedPools(id),
              nominationPoolsQuery.poolMembers.entries(),
              nominationPoolsQuery.rewardPools(id)
            ]);

            const pool = (bondedPools as any)?.unwrap();
            const members = (poolMembers as any[])?.filter(([_, member]) => (member as any).unwrap().poolId.eq(id));

            return {
              id,
              name: metadata!.toString(),
              members: members.length,
              totalStaked: formatBalance((pool as any)?.points || 0, { withUnit: false }),
              rewardRate: this.calculatePoolRewardRate(rewardPool),
              commission: ((pool as any)?.commission?.toNumber() || 0) / 10_000_000,
              validators: ((pool as any)?.nominators?.toArray() || []).map((v: any) => v.toString())
            };
          } catch {
            return null;
          }
        })
      );

      return poolsData.filter(Boolean) as NominationPool[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getStakingHistory(address: string): Promise<StakingHistory[]> {
    try {
      if (!this.api?.query?.staking) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const stakingQuery = this.api.query.staking;
      
      if (!stakingQuery.erasRewardPoints || !stakingQuery.erasStakers) {
        throw new PolkadotHubError(
          'Required staking queries not available',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const currentEra = await this.getCurrentEra();
      const historyLength = 84; // Last 84 eras (approximately 2 weeks)
      const startEra = Math.max(0, currentEra - historyLength);

      const history: StakingHistory[] = [];
      for (let era = startEra; era <= currentEra; era++) {
        const [rewards, exposure, timestamp] = await Promise.all([
          stakingQuery.erasRewardPoints(era),
          stakingQuery.erasStakers(era, address),
          this.getEraTimestamp(era)
        ]);

        const rewardsData = rewards as StakingEraPoints;
        const exposureData = exposure as StakingExposure;

        history.push({
          era,
          reward: formatBalance((rewardsData as any).individual.get(address) || 0, { withUnit: false }),
          timestamp,
          validators: ((exposureData as any).others || []).map((validator: any) => ({
            address: validator.who.toString(),
            amount: formatBalance(validator.value, { withUnit: false })
          }))
        });
      }

      return history;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getStakingDuration(address: string): Promise<StakingDuration> {
    try {
      if (!this.api?.query?.staking?.ledger) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const stakingLedger = await this.api.query.staking.ledger<StakingLedgerType>(address);
      const ledger = (stakingLedger as any).unwrap();

      if (!ledger) {
        throw new PolkadotHubError(
          'No staking ledger found',
          ErrorCodes.STAKING.VALIDATOR_ERROR,
          'No staking information found for this address.'
        );
      }

      return {
        startDate: ledger.claimedRewards[0] ? await this.getEraTimestamp(ledger.claimedRewards[0]) : Date.now(),
        totalDays: Math.floor((Date.now() - (await this.getEraTimestamp(ledger.claimedRewards[0]))) / (24 * 60 * 60 * 1000)),
        unbondingPeriods: (ledger.unlocking || []).map((chunk: any) => ({
          amount: formatBalance(chunk.value, { withUnit: false }),
          unlockDate: Date.now() + (chunk.era.toNumber() * 24 * 60 * 60 * 1000)
        })),
        rewardFrequency: 24 // Hours between rewards
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRewardsHistory(address: string): Promise<Array<{
    era: number;
    amount: string;
    timestamp: number;
  }>> {
    try {
      if (!this.api?.query?.staking) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const stakingQuery = this.api.query.staking;

      // Ensure required methods exist
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
      if (!this.api?.query?.session?.validators || !this.api?.query?.staking?.erasStakers) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      const sessionQuery = this.api.query.session;
      const stakingQuery = this.api.query.staking;

      // Ensure required methods exist
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

  async nominate(_validators: string[], _amount: string): Promise<void> {
    try {
      if (!this.api) {
        throw new PolkadotHubError(
          'API not initialized',
          ErrorCodes.API.ERROR,
          'Please try again in a few moments.'
        );
      }

      // TODO: Implement actual nomination logic
      throw new PolkadotHubError(
        'Nomination not implemented',
        ErrorCodes.STAKING.NOMINATION_FAILED,
        'This feature is not yet implemented.'
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getCurrentEra(): Promise<number> {
    if (!this.api?.query?.staking?.activeEra) {
      throw new PolkadotHubError(
        'API not initialized',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const activeEra = await this.api.query.staking.activeEra();
    return (activeEra as any)?.unwrap()?.index?.toNumber() || 0;
  }

  private async getEraTimestamp(era: number): Promise<number> {
    if (!this.api?.query?.staking?.erasStartSessionIndex) {
      throw new PolkadotHubError(
        'API not initialized',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const timestamp = await this.api.query.staking.erasStartSessionIndex(era);
    return ((timestamp as any)?.toNumber() || 0) * 6000; // Convert block number to milliseconds
  }

  private async calculateEraRewards(_validatorAddress: string): Promise<string> {
    if (!this.api?.query?.staking?.erasValidatorReward) {
      throw new PolkadotHubError(
        'API not initialized',
        ErrorCodes.API.ERROR,
        'Please try again in a few moments.'
      );
    }

    const rewards = await this.api.query.staking.erasValidatorReward(await this.getCurrentEra());
    return formatBalance((rewards as any)?.unwrapOr(0) || 0, { withUnit: false });
  }

  private calculatePoolRewardRate(_rewardPool: any): number {
    // TODO: Implement actual reward rate calculation
    return 12.5;
  }

  private handleError(error: unknown): never {
    if (error instanceof PolkadotHubError) {
      throw error;
    }

    throw new PolkadotHubError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      ErrorCodes.STAKING.NOMINATION_FAILED,
      'Please try again later.'
    );
  }
}

export const stakingService = new StakingService(); 