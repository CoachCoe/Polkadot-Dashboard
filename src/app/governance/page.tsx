'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useGovernance } from '@/hooks/useGovernance';
import { useWalletStore } from '@/store/useWalletStore';
import { DelegationPanel } from '@/components/governance/DelegationPanel';
import { DelegationInfo } from '@/components/governance/DelegationInfo';
import { TrackInfo } from '@/components/governance/TrackInfo';
import { GovernanceStats } from '@/components/governance/GovernanceStats';
import { GovernanceCharts } from '@/components/governance/GovernanceCharts';
import { ReferendaFilters, type StatusFilter, type SortOption } from '@/components/governance/ReferendaFilters';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { PolkadotHubError } from '@/utils/errorHandling';
import type { Referendum } from '@/services/governance';

export default function GovernancePage() {
  const { selectedAccount } = useWalletStore();
  const {
    referenda,
    tracks,
    delegations,
    delegationHistory,
    isLoading,
    error,
    vote,
    delegate,
    undelegate,
    refresh
  }: { referenda: Referendum[] } & Record<string, any> = useGovernance();

  const [selectedReferendum, setSelectedReferendum] = useState<number | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number>(0);
  const [voteAmount, setVoteAmount] = useState('');
  const [isDelegating, setIsDelegating] = useState(false);
  const [errorState, setErrorState] = useState<PolkadotHubError | null>(null);

  // Filtering and sorting state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const filteredReferenda = useMemo(() => {
    let filtered = [...referenda];

    // Apply track filter
    if (selectedTrackId !== undefined) {
      filtered = filtered.filter(ref => ref.track === selectedTrackId.toString());
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ref => 
        statusFilter === 'active' 
          ? ref.status !== 'Completed'
          : ref.status === 'Completed'
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return parseInt(a.submittedAt) - parseInt(b.submittedAt);
        case 'most-votes':
          const aVotes = parseFloat(a.tally.ayes) + parseFloat(a.tally.nays);
          const bVotes = parseFloat(b.tally.ayes) + parseFloat(b.tally.nays);
          return bVotes - aVotes;
        case 'highest-turnout':
          return parseFloat(b.tally.support) - parseFloat(a.tally.support);
        default: // newest
          return parseInt(b.submittedAt) - parseInt(a.submittedAt);
      }
    });

    return filtered;
  }, [referenda, selectedTrackId, statusFilter, sortBy]);

  if (!selectedAccount) {
    return (
      <DashboardLayout>
        <div className="px-6">
          <ErrorDisplay 
            error={new PolkadotHubError(
              'Please connect your wallet to participate in governance.',
              'WALLET_NOT_FOUND'
            )}
          />
        </div>
      </DashboardLayout>
    );
  }

  const handleVote = async (referendumIndex: number, voteType: 'aye' | 'nay') => {
    try {
      await vote(referendumIndex, voteType, voteAmount);
      setSelectedReferendum(null);
      setVoteAmount('');
      setErrorState(new PolkadotHubError('Vote submitted successfully'));
    } catch (err) {
      console.error('Failed to vote:', err);
      setErrorState(new PolkadotHubError(
        'Failed to submit vote',
        'TRANSACTION_FAILED',
        err instanceof Error ? err.message : 'Unknown error occurred'
      ));
    }
  };

  const handleDelegate = async (trackId: number, target: string, amount: string, conviction: number) => {
    try {
      setIsDelegating(true);
      await delegate(trackId, target, amount, conviction);
      setErrorState(new PolkadotHubError('Delegation successful'));
    } catch (err) {
      console.error('Failed to delegate:', err);
      setErrorState(new PolkadotHubError(
        'Failed to delegate',
        'TRANSACTION_FAILED',
        err instanceof Error ? err.message : 'Unknown error occurred'
      ));
    } finally {
      setIsDelegating(false);
    }
  };

  const handleUndelegate = async (trackId: number) => {
    try {
      await undelegate(trackId);
      setErrorState(new PolkadotHubError('Successfully undelegated'));
    } catch (err) {
      console.error('Failed to undelegate:', err);
      setErrorState(new PolkadotHubError(
        'Failed to undelegate',
        'TRANSACTION_FAILED',
        err instanceof Error ? err.message : 'Unknown error occurred'
      ));
    }
  };

  const handleTrackChange = (trackId: number | undefined) => {
    setSelectedTrackId(trackId ?? 0);
  };

  const handleRefresh = () => {
    void refresh();
  };

  return (
    <DashboardLayout>
      <div className="px-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Governance</h1>
          <button
            onClick={handleRefresh}
            className="text-pink-600 hover:text-pink-700"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {(error || errorState) && (
          <ErrorDisplay
            error={errorState || new PolkadotHubError(error || 'An error occurred')}
            action={error ? { label: 'Try Again', onClick: handleRefresh } : undefined}
          />
        )}

        <GovernanceStats
          tracks={tracks}
          referenda={referenda}
          isLoading={isLoading}
        />

        <GovernanceCharts
          tracks={tracks}
          referenda={referenda}
          isLoading={isLoading}
        />

        <section>
          <h2 className="text-2xl font-semibold mb-4">Tracks</h2>
          <TrackInfo
            tracks={tracks}
            onSelectTrack={handleTrackChange}
            selectedTrackId={selectedTrackId}
            isLoading={isLoading}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Delegation</h2>
          <div className="space-y-6">
            <DelegationPanel
              onDelegate={handleDelegate}
              tracks={tracks}
              isLoading={isDelegating}
            />
            <DelegationInfo
              delegations={delegations}
              delegationHistory={delegationHistory}
              tracks={tracks}
              onUndelegate={handleUndelegate}
              isLoading={isLoading}
            />
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Referenda</h2>
            <p className="text-sm text-gray-500">
              {filteredReferenda.length} referenda found
            </p>
          </div>

          <ReferendaFilters
            tracks={tracks}
            selectedTrackId={selectedTrackId}
            selectedStatus={statusFilter}
            sortBy={sortBy}
            onTrackChange={handleTrackChange}
            onStatusChange={setStatusFilter}
            onSortChange={setSortBy}
          />

          <div className="mt-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading referenda...</p>
              </div>
            ) : filteredReferenda.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No referenda found matching the current filters.</p>
              </div>
            ) : (
              filteredReferenda.map((ref) => (
                <div key={ref.index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{ref.title}</h3>
                      <p className="text-gray-600 mt-1">Track: {ref.track}</p>
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${ref.status === 'Deciding' ? 'bg-blue-100 text-blue-800' :
                        ref.status === 'Confirming' ? 'bg-green-100 text-green-800' :
                        ref.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'}
                    `}>
                      {ref.status}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{ref.description}</p>

                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <p className="font-medium">Ayes</p>
                      <p>{ref.tally.ayes} DOT</p>
                    </div>
                    <div>
                      <p className="font-medium">Nays</p>
                      <p>{ref.tally.nays} DOT</p>
                    </div>
                    <div>
                      <p className="font-medium">Support</p>
                      <p>{ref.tally.support} DOT</p>
                    </div>
                  </div>

                  {selectedReferendum === ref.index ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount (DOT)
                        </label>
                        <input
                          type="text"
                          value={voteAmount}
                          onChange={(e) => setVoteAmount(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter amount to vote with"
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleVote(ref.index, 'aye')}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Vote Aye
                        </button>
                        <button
                          onClick={() => handleVote(ref.index, 'nay')}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Vote Nay
                        </button>
                        <button
                          onClick={() => setSelectedReferendum(null)}
                          className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedReferendum(ref.index)}
                      className="w-full bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
                      disabled={ref.status === 'Completed'}
                    >
                      {ref.status === 'Completed' ? 'Voting Ended' : 'Vote on Referendum'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
} 