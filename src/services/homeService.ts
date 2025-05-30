export interface Transaction {
  hash: string;
  type: string;
  amount: string;
  timestamp: number;
  chain: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface StakingInfo {
  validatorAddress: string;
  amount: string;
  rewards: string;
  chain: string;
  status: 'active' | 'inactive';
}

export interface GovernanceActivity {
  referendumId: string;
  title: string;
  status: 'active' | 'passed' | 'rejected';
  vote: 'aye' | 'nay' | 'none';
  chain: string;
  timestamp: number;
}

export interface ChainBalance {
  chain: string;
  available: string;
  locked: string;
  reserved: string;
  total: string;
}

export interface HomeData {
  balances: ChainBalance[];
  stakes: StakingInfo[];
  transactions: Transaction[];
  governanceActivity: GovernanceActivity[];
  totalValue: string;
}

class HomeService {
  async getHomeData(_address: string): Promise<HomeData> {
    // Mock data for now
    return {
      balances: [
        {
          chain: 'Polkadot',
          available: '1000.00',
          locked: '500.00',
          reserved: '100.00',
          total: '1600.00'
        },
        {
          chain: 'Kusama',
          available: '500.00',
          locked: '200.00',
          reserved: '50.00',
          total: '750.00'
        }
      ],
      stakes: [
        {
          validatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          amount: '500.00',
          rewards: '50.00',
          chain: 'Polkadot',
          status: 'active'
        },
        {
          validatorAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          amount: '200.00',
          rewards: '20.00',
          chain: 'Kusama',
          status: 'active'
        }
      ],
      transactions: [
        {
          hash: '0x1234567890abcdef',
          type: 'Transfer',
          amount: '100.00 DOT',
          timestamp: Date.now(),
          chain: 'Polkadot',
          status: 'completed'
        },
        {
          hash: '0xabcdef1234567890',
          type: 'Stake',
          amount: '500.00 DOT',
          timestamp: Date.now() - 86400000,
          chain: 'Polkadot',
          status: 'completed'
        },
        {
          hash: '0x9876543210fedcba',
          type: 'Governance',
          amount: '0.00 DOT',
          timestamp: Date.now() - 172800000,
          chain: 'Kusama',
          status: 'completed'
        }
      ],
      governanceActivity: [
        {
          referendumId: '123',
          title: 'Increase minimum stake amount',
          status: 'active',
          vote: 'aye',
          chain: 'Polkadot',
          timestamp: Date.now() - 86400000
        },
        {
          referendumId: '456',
          title: 'Update runtime version',
          status: 'passed',
          vote: 'aye',
          chain: 'Kusama',
          timestamp: Date.now() - 172800000
        }
      ],
      totalValue: '2350.00'
    };
  }
}

export const homeService = new HomeService(); 