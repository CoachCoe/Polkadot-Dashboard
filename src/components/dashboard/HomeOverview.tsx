import React from 'react';
import { Card } from '@/components/ui/Card';
import { homeService, type HomeData, type StakingInfo, type Transaction } from '@/services/homeService';

interface HomeOverviewProps {
  address: string;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ address }) => {
  const [homeData, setHomeData] = React.useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await homeService.getHomeData(address);
        setHomeData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load home data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [address]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">Loading home data...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Error loading home data: {error}</p>
      </Card>
    );
  }

  if (!homeData) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">No home data available</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Balance Overview</h2>
        <div className="mt-2">
          <p className="text-3xl font-bold">{homeData.balance} DOT</p>
          <p className="text-gray-600">Available Balance</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Staking Overview</h2>
        <div className="mt-2">
          <p className="text-3xl font-bold">
            {homeData.stakes.reduce((total: number, stake: StakingInfo) => total + parseFloat(stake.amount), 0)} DOT
          </p>
          <p className="text-gray-600">Total Staked</p>
        </div>
      </Card>

      <Card className="col-span-2 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {homeData.transactions.length > 0 ? (
          <div className="space-y-4">
            {homeData.transactions.map((tx: Transaction) => (
              <div key={tx.hash} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <p className="font-medium">{tx.type}</p>
                  <p className="font-medium">{tx.amount}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(tx.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No recent transactions</p>
        )}
      </Card>
    </div>
  );
}; 