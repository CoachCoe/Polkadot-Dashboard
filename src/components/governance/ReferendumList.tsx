'use client';

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { governanceService, type ReferendumInfo } from '@/services/governanceService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface ReferendumListProps {
  className?: string;
}

export function ReferendumList({ className }: ReferendumListProps) {
  const { selectedAccount } = useWalletStore();
  const [referenda, setReferenda] = useState<ReferendumInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [conviction, setConviction] = useState(1);

  useEffect(() => {
    void loadReferenda();
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await governanceService.subscribeToReferendumUpdates(
        (updatedReferenda) => setReferenda(updatedReferenda)
      );
    };

    void setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadReferenda = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await governanceService.getReferenda();
      setReferenda(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referenda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (referendumIndex: number, isAye: boolean) => {
    if (!selectedAccount || !voteAmount) return;

    try {
      setError(null);
      await governanceService.vote(
        selectedAccount.address,
        referendumIndex,
        isAye,
        conviction,
        voteAmount
      );
      void loadReferenda();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'text-green-600 bg-green-50';
      case 'Rejected':
        return 'text-red-600 bg-red-50';
      case 'Cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Active Referenda</h2>
        <Button
          onClick={() => void loadReferenda()}
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

      <div className="space-y-4">
        {referenda.map((referendum) => (
          <Card key={referendum.index} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{referendum.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Proposed by: {referendum.proposer.slice(0, 6)}...{referendum.proposer.slice(-4)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  referendum.status
                )}`}
              >
                {referendum.status}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{referendum.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Ayes</p>
                <p className="font-medium">{referendum.voteCount.ayes} DOT</p>
              </div>
              <div>
                <p className="text-gray-500">Nays</p>
                <p className="font-medium">{referendum.voteCount.nays} DOT</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>
                Ends {formatDistanceToNow(referendum.end, { addSuffix: true })}
              </p>
              <p>Threshold: {referendum.threshold}</p>
            </div>

            {referendum.status === 'Ongoing' && selectedAccount && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (DOT)
                    </label>
                    <input
                      type="number"
                      value={voteAmount}
                      onChange={(e) => setVoteAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="flex-1">
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

                <div className="flex gap-4">
                  <Button
                    onClick={() => void handleVote(referendum.index, true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={!voteAmount || isLoading}
                  >
                    Vote Aye
                  </Button>
                  <Button
                    onClick={() => void handleVote(referendum.index, false)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={!voteAmount || isLoading}
                  >
                    Vote Nay
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {referenda.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            No active referenda at the moment
          </div>
        )}
      </div>
    </div>
  );
} 