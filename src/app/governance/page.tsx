'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Track, Referendum, governanceService } from '@/services/governance';
import { TrackList } from '@/components/governance/TrackList';
import { ReferendaList } from '@/components/governance/ReferendumList';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Button } from '@/components/ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function GovernancePage() {
  const { selectedAccount } = useWalletStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [referenda, setReferenda] = useState<Referendum[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedReferendum, setSelectedReferendum] = useState<number | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      void loadData();
    }
  }, [selectedAccount]);

  const loadData = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load tracks and referenda in parallel
      const [tracksData, referendaData] = await Promise.all([
        governanceService.getTracks(),
        governanceService.getReferenda()
      ]);

      setTracks(tracksData);
      setReferenda(referendaData);
    } catch (err) {
      console.error('Failed to load governance data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleVote = async (referendumIndex: number, voteType: 'aye' | 'nay') => {
    if (!selectedAccount || !voteAmount) return;

    try {
      await governanceService.vote(
        referendumIndex,
        voteType,
        voteAmount,
        selectedAccount.address
      );
      
      // Refresh data after voting
      await loadData();
      
      // Reset vote amount and selected referendum
      setVoteAmount('');
      setSelectedReferendum(null);
    } catch (err) {
      console.error('Failed to submit vote:', err);
      setError(err as Error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  if (!selectedAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view governance data.</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Governance</h1>
        <Button
          onClick={handleRefresh}
          className="flex items-center space-x-2"
          disabled={isRefreshing}
        >
          <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Active Referenda</h2>
        <ReferendaList
          referenda={referenda}
          isLoading={isLoading}
          selectedReferendum={selectedReferendum}
          voteAmount={voteAmount}
          onVoteAmountChange={setVoteAmount}
          onVote={handleVote}
          onSelectReferendum={setSelectedReferendum}
        />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Tracks</h2>
        <TrackList
          tracks={tracks}
          onSelectTrack={setSelectedTrackId}
          selectedTrackId={selectedTrackId}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
} 