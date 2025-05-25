import React from 'react';
import { Track, Referendum } from '@/services/governance';

interface GovernanceStatsProps {
  tracks: Track[];
  referenda: Referendum[];
  isLoading: boolean;
}

export function GovernanceStats({
  tracks,
  referenda,
  isLoading
}: GovernanceStatsProps) {
  const calculateStats = () => {
    const activeReferenda = referenda.filter(ref => ref.status !== 'Completed').length;
    const totalVotes = referenda.reduce((acc, ref) => {
      const ayes = parseFloat(ref.tally.ayes) || 0;
      const nays = parseFloat(ref.tally.nays) || 0;
      return acc + ayes + nays;
    }, 0);
    const averageTurnout = referenda.reduce((acc, ref) => {
      return acc + (parseFloat(ref.tally.support) || 0);
    }, 0) / (referenda.length || 1);

    const trackStats = tracks.reduce((acc, track) => {
      const trackReferenda = referenda.filter(ref => ref.track === track.id.toString());
      acc[track.id] = {
        total: trackReferenda.length,
        active: trackReferenda.filter(ref => ref.status !== 'Completed').length,
        passed: trackReferenda.filter(ref => {
          const ayes = parseFloat(ref.tally.ayes) || 0;
          const nays = parseFloat(ref.tally.nays) || 0;
          return ayes > nays;
        }).length
      };
      return acc;
    }, {} as Record<number, { total: number; active: number; passed: number }>);

    return {
      activeReferenda,
      totalVotes,
      averageTurnout,
      trackStats
    };
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Governance Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Active Referenda</p>
          <p className="text-2xl font-semibold mt-1">{stats.activeReferenda}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Votes Cast</p>
          <p className="text-2xl font-semibold mt-1">
            {stats.totalVotes.toLocaleString()} DOT
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Average Turnout</p>
          <p className="text-2xl font-semibold mt-1">
            {(stats.averageTurnout * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Tracks</p>
          <p className="text-2xl font-semibold mt-1">{tracks.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="font-medium mb-4">Track Performance</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Track
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Referenda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pass Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tracks.map((track) => {
                const trackStat = stats.trackStats[track.id];
                const passRate = trackStat
                  ? ((trackStat.passed / trackStat.total) * 100).toFixed(1)
                  : '0.0';

                return (
                  <tr key={track.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {track.name}
                        </p>
                        <p className="text-sm text-gray-500">ID: {track.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trackStat?.total || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {trackStat?.active || 0} active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {passRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 