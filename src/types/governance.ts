export interface Referendum {
  index: number;
  title: string;
  description: string;
  status: 'ongoing' | 'completed' | 'cancelled';
  trackId: number;
  proposer: string;
  deposit: string;
  enactmentDelay: number;
  voteStart: number;
  voteEnd: number;
  ayes: string;
  nays: string;
  turnout: string;
}

export interface Track {
  id: number;
  name: string;
  description: string;
  minDeposit: string;
  decisionPeriod: number;
  preparePeriod: number;
  enactmentPeriod: number;
  minApproval: number;
  minSupport: number;
}

export interface DelegationInfo {
  trackId: number;
  target: string;
  amount: string;
  conviction: number;
  delegatedAt: number;
} 