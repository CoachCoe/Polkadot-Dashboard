import React from 'react';
import { Track } from '@/services/governance';
import { Card } from '@/components/ui/Card';

interface TrackListProps {
  tracks: Track[];
  onSelectTrack: (trackId: number) => void;
  selectedTrackId: number | undefined;
  isLoading: boolean;
}

export function TrackList({
  tracks,
  onSelectTrack,
  selectedTrackId,
  isLoading
}: TrackListProps) {
  // Ensure unique tracks by ID
  const uniqueTracks = React.useMemo(() => {
    const trackMap = new Map<number, Track>();
    tracks.forEach(track => {
      if (!trackMap.has(track.id)) {
        trackMap.set(track.id, track);
      }
    });
    return Array.from(trackMap.values()).sort((a, b) => a.id - b.id);
  }, [tracks]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`loading-skeleton-${index}`} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (uniqueTracks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tracks available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {uniqueTracks.map((track) => (
        <Card
          key={`track-${track.id}`}
          className={`
            p-4 border-2 cursor-pointer transition-all
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

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Min Deposit</p>
              <p className="text-sm font-medium">{track.minDeposit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Decision Period</p>
              <p className="text-sm font-medium">{track.decisionPeriod} blocks</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 