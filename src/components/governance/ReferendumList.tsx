'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { governanceService, type ReferendumInfo } from '@/services/governanceService';
import { type Track } from '@/services/governance';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReferendaFilters } from './ReferendaFilters';
import { ReferendumComments } from './ReferendumComments';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { formatDateTime, formatBalance } from '@/utils/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

export function ReferendumList() {
  const { selectedAccount } = useWalletStore();
  const [referenda, setReferenda] = useState<ReferendumInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReferendum, setSelectedReferendum] = useState<ReferendumInfo | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    track: 'all',
    favorites: false
  });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-votes' | 'highest-turnout'>('newest');

  useEffect(() => {
    loadReferenda();
    loadFavorites();
    loadTracks();
  }, [selectedAccount, filters]);

  async function loadTracks() {
    try {
      const tracksData = await governanceService.getTracks();
      setTracks(tracksData);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  }

  async function loadReferenda() {
    try {
      setIsLoading(true);
      const data = await governanceService.getReferenda(filters);
      setReferenda(data);
    } catch (error) {
      console.error('Failed to load referenda:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFavorites() {
    if (!selectedAccount) return;
    try {
      const favs = await governanceService.getFavoriteReferenda(selectedAccount.address);
      setFavorites(favs);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  async function toggleFavorite(referendumId: number) {
    if (!selectedAccount) return;
    try {
      if (favorites.includes(referendumId)) {
        await governanceService.removeFavoriteReferendum(selectedAccount.address, referendumId);
        setFavorites(favorites.filter(id => id !== referendumId));
      } else {
        await governanceService.addFavoriteReferendum(selectedAccount.address, referendumId);
        setFavorites([...favorites, referendumId]);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  }

  function getStatusColor(status: ReferendumInfo['status']) {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <ReferendaFilters
          tracks={tracks}
          selectedTrackId={filters.track === 'all' ? undefined : Number(filters.track)}
          selectedStatus={filters.status as 'all' | 'active' | 'completed'}
          sortBy={sortBy}
          onTrackChange={(trackId) => setFilters({ ...filters, track: trackId ? String(trackId) : 'all' })}
          onStatusChange={(status) => setFilters({ ...filters, status })}
          onSortChange={setSortBy}
          filters={filters}
          onChange={setFilters}
          showFavoritesFilter={favorites.length > 0}
        />
      </div>

      <div className="space-y-4">
        {referenda.map((referendum) => (
          <Card key={referendum.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold">#{referendum.id} {referendum.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(referendum.status)}`}>
                    {referendum.status}
                  </span>
                  <span className="text-sm text-gray-500">{referendum.track}</span>
                </div>
                <p className="mt-2 text-gray-600 line-clamp-2">{referendum.description}</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Turnout</p>
                    <p className="font-medium">{formatBalance(referendum.turnout)} DOT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ayes</p>
                    <p className="font-medium text-green-600">{formatBalance(referendum.ayes)} DOT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nays</p>
                    <p className="font-medium text-red-600">{formatBalance(referendum.nays)} DOT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium">{formatDateTime(referendum.voteEnd)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(referendum.id)}
                  className={favorites.includes(referendum.id) ? 'text-yellow-500' : 'text-gray-400'}
                >
                  {favorites.includes(referendum.id) ? (
                    <StarSolid className="h-5 w-5" />
                  ) : (
                    <StarOutline className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedReferendum(referendum);
                    setShowComments(true);
                  }}
                >
                  <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedReferendum && `Comments on Referendum #${selectedReferendum.id}`}
            </DialogTitle>
          </DialogHeader>
          {selectedReferendum && (
            <ReferendumComments referendumId={String(selectedReferendum.id)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 