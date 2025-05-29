import type { Codec } from '@polkadot/types/types';
import type { AccountId, Balance, Moment } from '@polkadot/types/interfaces';
import type { StorageEntryBase } from '@polkadot/api/types/storage';

export interface ChainInfo {
  name: string;
  tokenSymbol: string;
  tokenDecimals: number;
  ss58Format: number;
}

export interface ValidatorIdentity {
  display: string | null;
  email: string | null;
  web: string | null;
  twitter: string | null;
}

export interface ValidatorInfo {
  address: string;
  commission: string;
  totalStake: string;
  nominators: number;
  isActive: boolean;
  identity: ValidatorIdentity | null;
}

export interface StakingInfo {
  totalStaked: string;
  activeValidators: number;
  minimumStake: string;
  activeEra: number;
  rewardRate: string;
  stakingEnabled: boolean;
}

export interface NominatorInfo {
  targets: string[];
  totalStaked: string;
  rewards: {
    lastEra: string;
    totalRewards: string;
  };
  status: 'active' | 'inactive' | 'waiting';
  unlocking: Array<{
    value: string;
    era: number;
  }>;
}

export interface RewardHistory {
  era: number;
  amount: string;
}

export interface TransactionStatus {
  isReady: boolean;
  isInBlock: boolean;
  isFinalized: boolean;
  error?: string;
}

export type AnyFunction = (...args: any[]) => any;
export type AnyStorageEntry = StorageEntryBase<'promise', AnyFunction, any[]>;

export interface StakingQueries {
  validators: AnyStorageEntry;
  validatorPrefs: AnyStorageEntry;
  activeEra: AnyStorageEntry;
  erasStakersPayout: AnyStorageEntry;
}

// Polkadot API specific types
export interface StorageKey<T = any> extends Codec {
  args: T[];
  meta: any;
  method: string;
  section: string;
  toJSON: () => any;
  toString: () => string;
}

export interface ValidatorExposure {
  total?: Balance;
  own?: Balance;
  others: Array<{
    who: AccountId;
    value: Balance;
  }>;
}

export interface ValidatorPrefs {
  commission: number;
  blocked: boolean;
}

export interface EraIndex extends Codec {
  toNumber: () => number;
}

export interface ActiveEraInfo {
  index: EraIndex;
  start: Option<Moment>;
}

export interface Option<T> {
  isSome: boolean;
  isNone: boolean;
  value?: T;
  unwrap: () => T;
  unwrapOr: (defaultValue: T) => T;
  unwrapOrDefault: () => T;
} 