'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { governanceService, type DelegationInfo } from '@/services/governanceService';

interface VotingStats {
  totalVotes: number;
  ayeVotes: number;
  nayVotes: number;
  averageConviction: number;
  totalValue: string;
  recentActivity: {
    date: string;
    votes: number;
  }[];
}

interface ActivityItem {
  date: string;
  votes: number;
}

export function VotingHistory({ address }: { address: string }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<DelegationInfo[]>([]);
  const [stats, setStats] = React.useState<VotingStats | null>(null);

  const fetchHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch delegation history from the service
      const delegations = await governanceService.getDelegationHistory(address);
      setHistory(delegations);

      if (delegations.length > 0) {
        // Calculate statistics
        const totalVotes = delegations.length;
        const totalValue = delegations.reduce((acc, d) => acc + parseFloat(d.balance), 0).toString();

        // Group delegations by date for recent activity
        const recentActivity = delegations
          .reduce((acc: ActivityItem[], delegation) => {
            const date = new Date(delegation.timestamp).toLocaleDateString();
            const existing = acc.find(a => a.date === date);
            if (existing) {
              existing.votes += 1;
            } else {
              acc.push({ date, votes: 1 });
            }
            return acc;
          }, [] as ActivityItem[])
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 7);

        setStats({
          totalVotes,
          ayeVotes: 0, // Not applicable for delegations
          nayVotes: 0, // Not applicable for delegations
          averageConviction: 0, // Not applicable for delegations
          totalValue,
          recentActivity
        });
      } else {
        setStats(null);
      }
    } catch (err) {
      setError('Failed to load delegation history. Please try again.');
      console.error('Error loading delegation history:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  React.useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return <LoadingState text="Loading delegation history..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error Loading History"
        message={error}
        action={{
          label: 'Try Again',
          onClick: () => {
            void fetchHistory();
          }
        }}
      />
    );
  }

  if (!stats || history.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No delegation history found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Delegation Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1">Total Delegations</Label>
            <p className="text-2xl font-bold">{stats.totalVotes}</p>
          </div>
          <div>
            <Label className="mb-1">Total Value Delegated</Label>
            <p className="text-2xl font-bold">{parseFloat(stats.totalValue).toFixed(2)} DOT</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {stats.recentActivity.map((activity) => (
            <div
              key={activity.date}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span>{activity.date}</span>
              <span className="font-medium">{activity.votes} delegations</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Delegation History</h3>
        <div className="space-y-4">
          {history.map((delegation) => (
            <div
              key={`${delegation.target}-${delegation.timestamp}`}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <span className="font-medium">Delegated to {delegation.target}</span>
                <div className="text-sm text-muted-foreground">
                  Track {delegation.track} • {new Date(delegation.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <span className="font-medium">{parseFloat(delegation.balance).toFixed(2)} DOT</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 