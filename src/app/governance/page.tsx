'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Track, Referendum } from '@/services/governance';
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
      // Simulated data loading for now
      // In a real app, this would come from the API
      setTracks([
        {
          id: 0,
          name: 'Root',
          description: 'Root track for fundamental changes',
          minDeposit: '100 DOT',
          decisionPeriod: 100800,
          preparePeriod: 50400,
          decidingPeriod: 100800,
          confirmPeriod: 25200,
          minApproval: 60,
          minSupport: 50
        },
        {
          id: 1,
          name: 'Whitelisted Caller',
          description: 'Track for whitelisted callers',
          minDeposit: '10 DOT',
          decisionPeriod: 50400,
          preparePeriod: 25200,
          decidingPeriod: 50400,
          confirmPeriod: 12600,
          minApproval: 55,
          minSupport: 45
        }
      ]);

      setReferenda([
        {
          index: 0,
          track: '0',
          title: 'Example Referendum',
          description: 'This is an example referendum',
          proposer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          status: 'Deciding',
          submittedAt: '1677649200',
          deposit: '100 DOT',
          tally: {
            ayes: '1000 DOT',
            nays: '500 DOT',
            support: '60%'
          },
          timeline: {
            created: 1677649200,
            deciding: 1677735600,
            confirming: null,
            completed: null
          }
        }
      ]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (_referendumIndex: number, _voteType: 'aye' | 'nay') => {
    try {
      // Vote implementation...
      await loadData();
    } catch (err) {
      setError(err as Error);
    }
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
          onClick={() => void loadData()}
          className="flex items-center space-x-2"
        >
          <ArrowPathIcon className="h-5 w-5" />
          <span>Refresh</span>
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