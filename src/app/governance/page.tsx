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
import type { Referendum, Track, DelegationInfo as DelegationInfoType } from '@/services/governance';
import { ReferendaList } from '@/components/governance/ReferendaList';

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
  }: {
    referenda: Referendum[];
    tracks: Track[];
    delegations: DelegationInfoType[];
    delegationHistory: DelegationInfoType[];
    isLoading: boolean;
    error: string | null;
    vote: (referendumIndex: number, vote: 'aye' | 'nay', amount: string) => Promise<void>;
    delegate: (trackId: number, target: string, amount: string, conviction: number) => Promise<void>;
    undelegate: (trackId: number) => Promise<void>;
    refresh: () => Promise<void>;
  } = useGovernance();

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
      setErrorState(new PolkadotHubError(
        'Vote submitted successfully',
        'VOTE_SUCCESS',
        'Your vote has been successfully recorded'
      ));
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
      setErrorState(new PolkadotHubError(
        'Delegation successful',
        'DELEGATE_SUCCESS',
        'Your delegation has been successfully recorded'
      ));
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
      setErrorState(new PolkadotHubError(
        'Successfully undelegated',
        'UNDELEGATE_SUCCESS',
        'Your undelegation has been successfully recorded'
      ));
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
            error={errorState || new PolkadotHubError(error || 'An error occurred', 'UNKNOWN_ERROR')}
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
          <h2 className="text-2xl font-semibold mb-4">Referenda</h2>
          <div className="flex justify-between items-center mb-4">
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
          <ReferendaList
            referenda={filteredReferenda}
            isLoading={isLoading}
            selectedReferendum={selectedReferendum}
            voteAmount={voteAmount}
            onVoteAmountChange={setVoteAmount}
            onVote={handleVote}
            onSelectReferendum={setSelectedReferendum}
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
      </div>
    </DashboardLayout>
  );
} 