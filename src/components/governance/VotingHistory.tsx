'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { governanceService, VoteHistory } from '@/services/governance';

interface VotingHistoryProps {
  address?: string | undefined;
}

export function VotingHistory({ address }: VotingHistoryProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [votes, setVotes] = useState<VoteHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    const userAddress = address || session?.user?.address;
    if (userAddress) {
      loadVotingHistory(userAddress);
    }
  }, [address, session?.user?.address]);

  const loadVotingHistory = async (userAddress: string) => {
    try {
      setIsLoading(true);
      const history = await governanceService.getVotingHistory(userAddress);
      setVotes(history);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to load voting history. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVotes = votes.filter(
    (vote) => filter === 'all' || vote.status === filter
  );

  const renderVote = (vote: VoteHistory) => (
    <Card key={vote.referendumIndex} className="p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{vote.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Referendum #{vote.referendumIndex} • Status: {vote.status}
          </p>
          <p className="text-sm text-gray-500">
            Voted {formatDistanceToNow(vote.timestamp, { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              vote.vote === 'aye'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {vote.vote.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">{vote.amount} DOT</span>
        </div>
      </div>
    </Card>
  );

  if (!address && !session?.user?.address) {
    return (
      <Card className="p-4 text-center">
        <p>Please connect your wallet to view voting history.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Voting History</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading voting history...</div>
      ) : filteredVotes.length > 0 ? (
        <div className="space-y-4">
          {filteredVotes.map(renderVote)}
        </div>
      ) : (
        <Card className="p-4 text-center">
          <p>No voting history found for this address.</p>
        </Card>
      )}
    </div>
  );
} 