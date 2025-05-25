import React from 'react';
import { DelegationInfo as DelegationInfoType, Track } from '@/services/governance';

interface DelegationInfoProps {
  delegations: DelegationInfoType[];
  delegationHistory: DelegationInfoType[];
  tracks: Track[];
  onUndelegate: (trackId: number) => Promise<void>;
  isLoading: boolean;
}

export function DelegationInfo({
  delegations,
  delegationHistory,
  tracks,
  onUndelegate,
  isLoading
}: DelegationInfoProps) {
  const getTrackName = (trackId: number) => {
    return tracks.find(t => t.id === trackId)?.name || `Track ${trackId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Delegations</h3>
        {delegations.length === 0 ? (
          <p className="text-gray-500">No active delegations</p>
        ) : (
          <div className="grid gap-4">
            {delegations.map((delegation, index) => (
              <div
                key={`${delegation.target}-${index}`}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Track: {getTrackName(delegation.trackId)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Delegated to: {delegation.target}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">Amount: {delegation.amount} DOT</p>
                      <p className="text-sm">
                        Conviction: {delegation.conviction}x voting weight
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUndelegate(delegation.trackId)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={isLoading}
                  >
                    Undelegate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Delegation History</h3>
        {delegationHistory.length === 0 ? (
          <p className="text-gray-500">No delegation history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Track
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delegate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conviction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {delegationHistory.map((history, index) => (
                  <tr key={`${history.target}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(history.delegatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTrackName(history.trackId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {history.target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {history.amount} DOT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {history.conviction}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 