'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import polkadotApiService from '@/services/polkadotApiService';
import type { Referendum, Track, DelegationInfo } from '@/types/governance';

export function useGovernance() {
  const { selectedAccount } = useWalletStore();
  const [referenda, setReferenda] = useState<Referendum[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [delegations, setDelegations] = useState<DelegationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      void loadGovernanceData();
    }
  }, [selectedAccount]);

  const loadGovernanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        referendaData,
        tracksData,
        delegationsData
      ] = await Promise.all([
        polkadotApiService.getReferenda(),
        polkadotApiService.getTracks(),
        polkadotApiService.getDelegations(selectedAccount?.address)
      ]);

      setReferenda(referendaData);
      setTracks(tracksData);
      setDelegations(delegationsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load governance data'));
    } finally {
      setIsLoading(false);
    }
  };

  const vote = async (referendumIndex: number, vote: boolean, conviction: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedAccount) {
        throw new Error('No account selected');
      }

      await polkadotApiService.vote(referendumIndex, vote, conviction);
      await loadGovernanceData();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit vote'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const delegate = async (trackId: number, target: string, amount: string, conviction: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedAccount) {
        throw new Error('No account selected');
      }

      await polkadotApiService.delegate(trackId, target, amount, conviction);
      await loadGovernanceData();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delegate'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const undelegate = async (trackId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedAccount) {
        throw new Error('No account selected');
      }

      await polkadotApiService.undelegate(trackId);
      await loadGovernanceData();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to undelegate'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    referenda,
    tracks,
    delegations,
    isLoading,
    error,
    vote,
    delegate,
    undelegate,
    refresh: loadGovernanceData
  };
} 