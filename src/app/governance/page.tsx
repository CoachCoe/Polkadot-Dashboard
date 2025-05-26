'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Track, Referendum } from '@/services/governance';
import { TrackList } from '@/components/governance/TrackList';
import { TrackInfo } from '@/components/governance/TrackInfo';
import { ReferendumList } from '@/components/governance/ReferendumList';
import { DelegationInfo } from '@/components/governance/DelegationInfo';
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

  const handleTrackChange = (trackId: number) => {
    setSelectedTrackId(trackId === selectedTrackId ? undefined : trackId);
  };

  const handleRefresh = () => {
    void loadData();
  };

  if (!selectedAccount) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please connect your wallet to participate in governance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Governance</h1>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="mb-8">
          <ErrorDisplay error={error} />
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tracks</h2>
          <TrackList
            tracks={tracks}
            onSelectTrack={handleTrackChange}
            selectedTrackId={selectedTrackId}
            isLoading={isLoading}
          />
        </div>

        {selectedTrackId !== undefined && tracks.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Track Details</h2>
            <TrackInfo
              track={tracks.find(t => t.id === selectedTrackId)!}
            />
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4">Active Referenda</h2>
          <ReferendumList
            referenda={referenda}
            isLoading={isLoading}
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Delegations</h2>
          <DelegationInfo
            address={selectedAccount.address}
            isLoading={isLoading}
            delegations={[]}
            delegationHistory={[]}
            tracks={tracks}
          />
        </div>
      </div>
    </div>
  );
} 