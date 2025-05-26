'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { governanceService, type Referendum, type DelegationInfo, type Track } from '@/services/governance';
import { PolkadotHubError } from '@/utils/errorHandling';
import type { AddressOrPair } from '@polkadot/api/types';

export function useGovernance() {
  const { selectedAccount, signer } = useWalletStore();
  const [referenda, setReferenda] = useState<Referendum[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [delegations, setDelegations] = useState<DelegationInfo[]>([]);
  const [delegationHistory, setDelegationHistory] = useState<DelegationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccount) {
      void loadData();
    }
  }, [selectedAccount]);

  const loadData = async () => {
    if (!selectedAccount) return;

    try {
      setIsLoading(true);
      setError(null);
      const [
        referendaData,
        tracksData,
        delegationsData,
        delegationHistoryData
      ] = await Promise.all([
        governanceService.getReferenda(),
        governanceService.getTracks(),
        governanceService.getDelegations(selectedAccount.address),
        governanceService.getDelegationHistory(selectedAccount.address)
      ]);

      setReferenda(referendaData);
      setTracks(tracksData);
      setDelegations(delegationsData);
      setDelegationHistory(delegationHistoryData);
    } catch (err) {
      const errorMessage = err instanceof PolkadotHubError 
        ? err.message
        : 'Failed to load governance data';
      setError(errorMessage);
      console.error('Error loading governance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const vote = async (referendumIndex: number, vote: 'aye' | 'nay', amount: string) => {
    if (!selectedAccount || !signer) {
      throw new PolkadotHubError(
        'Wallet not connected',
        'WALLET_NOT_CONNECTED',
        'Please connect your wallet to vote'
      );
    }

    try {
      setIsLoading(true);
      setError(null);
      await governanceService.vote(referendumIndex, vote, amount, selectedAccount.address as AddressOrPair);
      await loadData(); // Refresh data after voting
    } catch (err) {
      const errorMessage = err instanceof PolkadotHubError 
        ? err.message
        : 'Failed to cast vote';
      setError(errorMessage);
      console.error('Error casting vote:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const delegate = async (trackId: number, target: string, amount: string, conviction: number) => {
    if (!selectedAccount || !signer) {
      throw new PolkadotHubError(
        'Wallet not connected',
        'WALLET_NOT_CONNECTED',
        'Please connect your wallet to delegate votes'
      );
    }

    try {
      setIsLoading(true);
      setError(null);
      await governanceService.delegate(trackId, target, amount, conviction, selectedAccount.address as AddressOrPair);
      await loadData(); // Refresh data after delegating
    } catch (err) {
      const errorMessage = err instanceof PolkadotHubError 
        ? err.message
        : 'Failed to delegate votes';
      setError(errorMessage);
      console.error('Error delegating votes:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const undelegate = async (trackId: number) => {
    if (!selectedAccount || !signer) {
      throw new PolkadotHubError(
        'Wallet not connected',
        'WALLET_NOT_CONNECTED',
        'Please connect your wallet to undelegate votes'
      );
    }

    try {
      setIsLoading(true);
      setError(null);
      await governanceService.undelegate(trackId, selectedAccount.address as AddressOrPair);
      await loadData(); // Refresh data after undelegating
    } catch (err) {
      const errorMessage = err instanceof PolkadotHubError 
        ? err.message
        : 'Failed to undelegate votes';
      setError(errorMessage);
      console.error('Error undelegating votes:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    referenda,
    tracks,
    delegations,
    delegationHistory,
    isLoading,
    error,
    vote,
    delegate,
    undelegate,
    refresh: loadData
  };
} 