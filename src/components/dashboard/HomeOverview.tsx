import React from 'react';
import { Card } from '@/components/ui/Card';
import { homeService, type HomeData, type StakingInfo, type Transaction, type GovernanceActivity, type ChainBalance } from '@/services/homeService';
import { formatBalance } from '@polkadot/util';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface HomeOverviewProps {
  address: string;
}

function safeFormatBalance(value: any) {
  try {
    if (value === undefined || value === null || value === '') return formatBalance('0');
    return formatBalance(value.toString());
  } catch {
    return formatBalance('0');
  }
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({ address }) => {
  const [homeData, setHomeData] = React.useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    void loadData();
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
    <div className="space-y-6">
      {/* Total Value and Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Total Portfolio Value</h2>
          <p className="text-4xl font-bold text-gray-900 mt-2">{safeFormatBalance(homeData.totalValue)} DOT</p>
        </div>
        <button
          onClick={() => void loadData()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`w-6 h-6 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Chain Balances */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Balance Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {homeData.balances.map((balance: ChainBalance) => (
            <div key={balance.chain} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{balance.chain}</h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">Available: {safeFormatBalance(balance.available)}</p>
                <p className="text-sm text-gray-600">Locked: {safeFormatBalance(balance.locked)}</p>
                <p className="text-sm text-gray-600">Reserved: {safeFormatBalance(balance.reserved)}</p>
                <p className="text-sm font-medium text-gray-900">Total: {safeFormatBalance(balance.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Staking Overview */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Staking Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {homeData.stakes.map((stake: StakingInfo) => (
            <div key={stake.validatorAddress} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{stake.chain}</h4>
                  <p className="text-sm text-gray-600 mt-1">Staked: {safeFormatBalance(stake.amount)}</p>
                  <p className="text-sm text-gray-600">Rewards: {safeFormatBalance(stake.rewards)}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  stake.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {stake.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Governance Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Governance Activity</h3>
        <div className="space-y-4">
          {homeData.governanceActivity.map((activity: GovernanceActivity) => (
            <div key={activity.referendumId} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{activity.chain}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    activity.status === 'passed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {activity.status}
                  </span>
                  {activity.vote !== 'none' && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activity.vote === 'aye' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.vote}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {homeData.transactions.map((tx: Transaction) => (
            <div key={tx.hash} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{tx.type}</h4>
                  <p className="text-sm text-gray-600 mt-1">{tx.chain}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{safeFormatBalance(tx.amount)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}; 