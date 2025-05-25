import React from 'react';
import { Track } from '@/services/governance';

interface TrackInfoProps {
  tracks: Track[];
  onSelectTrack: (trackId: number) => void;
  selectedTrackId?: number;
  isLoading: boolean;
}

export function TrackInfo({
  tracks,
  onSelectTrack,
  selectedTrackId,
  isLoading
}: TrackInfoProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Governance Tracks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`
              bg-white rounded-lg shadow-sm p-4 border-2 cursor-pointer transition-all
              ${selectedTrackId === track.id
                ? 'border-pink-500 shadow-md'
                : 'border-transparent hover:border-pink-200'}
            `}
            onClick={() => onSelectTrack(track.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{track.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{track.description}</p>
              </div>
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                ID: {track.id}
              </span>
            </div>
            
            {track.stats && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-600">Active</p>
                  <p className="font-medium">{track.stats.activeProposals}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-600">Total</p>
                  <p className="font-medium">{track.stats.totalProposals}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-600">Delegations</p>
                  <p className="font-medium">{track.stats.delegations}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-600">Turnout</p>
                  <p className="font-medium">{track.stats.averageTurnout}%</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 