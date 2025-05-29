'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { governanceService, type DelegationInfo, type Track } from '@/services/governance';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface DelegationProps {
  className?: string;
}

export function Delegation({ className }: DelegationProps) {
  const { selectedAccount } = useWalletStore();
  const [delegations, setDelegations] = useState<DelegationInfo[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [targetAddress, setTargetAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [conviction, setConviction] = useState(1);

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
      const [delegationsData, tracksData] = await Promise.all([
        governanceService.getDelegations(selectedAccount.address),
        governanceService.getTracks()
      ]);
      setDelegations(delegationsData);
      setTracks(tracksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delegation data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelegate = async () => {
    if (!selectedAccount || !selectedTrack || !targetAddress || !amount) return;

    try {
      setError(null);
      await governanceService.delegate(
        selectedTrack,
        targetAddress,
        amount,
        conviction,
        selectedAccount.address
      );
      void loadData();
      // Reset form
      setSelectedTrack(null);
      setTargetAddress('');
      setAmount('');
      setConviction(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delegate votes');
    }
  };

  const handleUndelegate = async (trackId: number) => {
    if (!selectedAccount) return;

    try {
      setError(null);
      await governanceService.undelegate(trackId, selectedAccount.address);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undelegate votes');
    }
  };

  if (!selectedAccount) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-600">
          Please connect your wallet to manage vote delegations.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <LoadingSpinner className="w-8 h-8 mx-auto" />
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Vote Delegation</h2>
        <Button
          onClick={() => void loadData()}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Card className="mb-6 p-6">
        <h3 className="text-lg font-medium mb-4">Delegate Votes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Track
            </label>
            <select
              value={selectedTrack ?? ''}
              onChange={(e) => setSelectedTrack(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a track</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name} - Min. Deposit: {track.minDeposit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Address
            </label>
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter delegate address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (DOT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="0.0"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conviction
            </label>
            <select
              value={conviction}
              onChange={(e) => setConviction(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={value}>
                  {value}x voting power ({value * 6} month lock)
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          onClick={() => void handleDelegate()}
          className="w-full"
          disabled={!selectedTrack || !targetAddress || !amount || isLoading}
        >
          Delegate Votes
        </Button>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Active Delegations</h3>
        {delegations.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-gray-600">No active delegations found.</p>
          </Card>
        ) : (
          delegations.map((delegation) => {
            const track = tracks.find((t) => t.id === delegation.trackId);
            return (
              <Card key={`${delegation.trackId}-${delegation.target}`} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      {track?.name || `Track ${delegation.trackId}`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Delegated to: {delegation.target.slice(0, 6)}...
                      {delegation.target.slice(-4)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Amount: {delegation.amount}
                    </p>
                    <p className="text-sm text-gray-500">
                      Conviction: {delegation.conviction}x
                    </p>
                  </div>
                  <Button
                    onClick={() => void handleUndelegate(delegation.trackId)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    Undelegate
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
} 