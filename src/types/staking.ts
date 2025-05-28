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

export interface StakingQueries {
  validators: any;  // Using any temporarily to fix type issues
  validatorPrefs: any;
  erasStakers: any;
  activeEra: any;
  erasStakersPayout: any;
} 