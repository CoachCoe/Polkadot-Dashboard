export interface Transaction {
  hash: string;
  type: string;
  amount: string;
  timestamp: number;
}

export interface StakingInfo {
  validatorAddress: string;
  amount: string;
  rewards: string;
}

export interface HomeData {
  balance: string;
  stakes: StakingInfo[];
  transactions: Transaction[];
}

class HomeService {
  async getHomeData(_address: string): Promise<HomeData> {
    // Mock data for now
    return {
      balance: '1000.00',
      stakes: [
        {
          validatorAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          amount: '500.00',
          rewards: '50.00'
        }
      ],
      transactions: [
        {
          hash: '0x1234567890abcdef',
          type: 'Transfer',
          amount: '100.00 DOT',
          timestamp: Date.now()
        },
        {
          hash: '0xabcdef1234567890',
          type: 'Stake',
          amount: '500.00 DOT',
          timestamp: Date.now() - 86400000 // 1 day ago
        }
      ]
    };
  }
}

export const homeService = new HomeService(); 