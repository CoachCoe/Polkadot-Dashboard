export const tokenPrices = {
  polkadot: {
    price: '$5.47',
    marketCap: '$7,123,456,789',
    volume24h: '$245,678,901'
  },
  kusama: {
    price: '$23.45',
    marketCap: '$234,567,890',
    volume24h: '$12,345,678'
  }
};

export type TokenPriceData = {
  price: string;
  marketCap: string;
  volume24h: string;
};

export function getTokenPrice(projectId: string): TokenPriceData {
  return tokenPrices[projectId as keyof typeof tokenPrices] || {
    price: '$0.00',
    marketCap: '$0',
    volume24h: '$0'
  };
} 