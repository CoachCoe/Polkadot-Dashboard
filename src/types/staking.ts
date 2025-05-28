export interface ChainInfo {
  name: string;
  tokenSymbol: string;
  tokenDecimals: number;
  ss58Format: number;
}

export interface ValidatorIdentity {
  display?: string;
  web?: string;
  email?: string;
  twitter?: string;
}

export interface ValidatorInfo {
  address: string;
  identity?: ValidatorIdentity;
  commission: string;
  totalStake: string;
  nominators: number;
  isActive: boolean;
  rewardPoints?: string;
}

export interface StakingInfo {
  totalStaked: string;
  activeEra: number;
  rewardRate: string;
  minNomination: string;
  maxNominators: number;
  unbondingDuration: number;
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