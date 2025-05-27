import React from 'react';
import { Track } from '@/services/governanceService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';

export type SortOption = 'newest' | 'oldest' | 'most-votes' | 'highest-turnout';
export type StatusFilter = 'all' | 'active' | 'completed';

interface ReferendaFiltersProps {
  tracks: Track[];
  selectedTrackId: number | undefined;
  selectedStatus: StatusFilter;
  sortBy: SortOption;
  onTrackChange: (trackId: number | undefined) => void;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sort: SortOption) => void;
  filters: {
    status: string;
    track: string;
    favorites: boolean;
  };
  onChange: (filters: {
    status: string;
    track: string;
    favorites: boolean;
  }) => void;
  showFavoritesFilter: boolean;
}

export function ReferendaFilters({
  tracks,
  selectedTrackId,
  selectedStatus,
  sortBy,
  onTrackChange,
  onStatusChange,
  onSortChange,
  filters,
  onChange,
  showFavoritesFilter,
}: ReferendaFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track
          </label>
          <select
            value={selectedTrackId || ''}
            onChange={(e) => onTrackChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Tracks</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most-votes">Most Votes</option>
            <option value="highest-turnout">Highest Turnout</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Quick Filters:</span>
          <button
            onClick={() => onStatusChange('active')}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedStatus === 'active'
                ? 'bg-pink-100 text-pink-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onStatusChange('completed')}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedStatus === 'completed'
                ? 'bg-pink-100 text-pink-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
        </div>

        <button
          onClick={() => {
            onTrackChange(undefined);
            onStatusChange('all');
            onSortChange('newest');
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset Filters
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onChange({ ...filters, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select
            value={filters.track}
            onValueChange={(value) =>
              onChange({ ...filters, track: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by track" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="root">Root</SelectItem>
              <SelectItem value="whitelisted_caller">Whitelisted Caller</SelectItem>
              <SelectItem value="staking_admin">Staking Admin</SelectItem>
              <SelectItem value="treasurer">Treasurer</SelectItem>
              <SelectItem value="lease_admin">Lease Admin</SelectItem>
              <SelectItem value="fellowship_admin">Fellowship Admin</SelectItem>
              <SelectItem value="general_admin">General Admin</SelectItem>
              <SelectItem value="auction_admin">Auction Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showFavoritesFilter && (
          <div className="flex items-center space-x-2">
            <Switch
              id="favorites"
              checked={filters.favorites}
              onCheckedChange={(checked) =>
                onChange({ ...filters, favorites: checked })
              }
            />
            <Label htmlFor="favorites">Show favorites only</Label>
          </div>
        )}
      </div>
    </div>
  );
} 