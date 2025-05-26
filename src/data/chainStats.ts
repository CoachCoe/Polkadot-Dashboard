export const chainStats = {
  polkadot: {
    monthlyTransactions: 1234567,
    monthlyActiveUsers: 45678,
    isStale: false
  },
  kusama: {
    monthlyTransactions: 987654,
    monthlyActiveUsers: 34567,
    isStale: false
  }
};

export type ChainStatsData = {
  monthlyTransactions: number;
  monthlyActiveUsers: number;
  isStale: boolean;
};

export function getChainStats(chainId: string): ChainStatsData {
  return chainStats[chainId as keyof typeof chainStats] || {
    monthlyTransactions: 0,
    monthlyActiveUsers: 0,
    isStale: true
  };
} 