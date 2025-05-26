import React from 'react';
import { Track } from '@/services/governance';
import { Card } from '@/components/ui/Card';

interface DelegationInfoType {
  trackId: number;
  target: string;
  amount: string;
  conviction: number;
  delegatedAt: number;
}

interface DelegationInfoProps {
  address: string;
  delegations: DelegationInfoType[];
  delegationHistory: DelegationInfoType[];
  tracks: Track[];
  isLoading: boolean;
  onUndelegate?: (trackId: number) => Promise<void>;
}

export function DelegationInfo({
  address,
  delegations,
  delegationHistory,
  tracks,
  isLoading,
  onUndelegate
}: DelegationInfoProps) {
  const getTrackName = (trackId: number) => {
    const track = tracks.find(t => t.id === trackId);
    return track ? track.name : `Track ${trackId}`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (delegations.length === 0 && delegationHistory.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No delegations found for {address}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {delegations.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Active Delegations</h3>
          </div>
          <div className="divide-y">
            {delegations.map((delegation, index) => (
              <div key={`${delegation.target}-${index}`} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {getTrackName(delegation.trackId)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Delegated to: {delegation.target}
                    </p>
                    <p className="text-sm text-gray-500">
                      Amount: {delegation.amount}
                    </p>
                    <p className="text-sm text-gray-500">
                      Conviction: {delegation.conviction}x
                    </p>
                  </div>
                  {onUndelegate && (
                    <button
                      onClick={() => onUndelegate(delegation.trackId)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                      disabled={isLoading}
                    >
                      Undelegate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {delegationHistory.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Delegation History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Track
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conviction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {delegationHistory.map((history, index) => (
                  <tr key={`${history.target}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(history.delegatedAt * 1000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTrackName(history.trackId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {history.target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {history.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {history.conviction}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
} 