'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { governanceService, type Referendum } from '@/services/governance';
import { useWalletStore } from '@/store/useWalletStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'ongoing', label: 'Active' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'timedOut', label: 'Timed Out' },
  { value: 'killed', label: 'Killed' }
];

const CONVICTION_OPTIONS = [
  { value: '0', label: '0.1x (Locked for 1x period)' },
  { value: '1', label: '1x (Locked for 1x period)' },
  { value: '2', label: '2x (Locked for 2x period)' },
  { value: '3', label: '3x (Locked for 4x period)' },
  { value: '4', label: '4x (Locked for 8x period)' },
  { value: '5', label: '5x (Locked for 16x period)' },
  { value: '6', label: '6x (Locked for 32x period)' }
];

export function ReferendumList() {
  const [referendums, setReferendums] = useState<Referendum[]>([]);
  const [filteredReferendums, setFilteredReferendums] = useState<Referendum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { selectedAccount } = useWalletStore();
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [selectedReferendum, setSelectedReferendum] = useState<Referendum | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [voteType, setVoteType] = useState<'aye' | 'nay'>('aye');
  const [conviction, setConviction] = useState('0');
  const [isVoting, setIsVoting] = useState(false);

  async function loadReferendums() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await governanceService.getReferenda();
      setReferendums(data);
      setFilteredReferendums(data);
    } catch (err) {
      console.error('Failed to load referendums:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referendums');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReferendums();
  }, []);

  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredReferendums(referendums);
    } else {
      setFilteredReferendums(referendums.filter(ref => ref.status === selectedStatus));
    }
  }, [selectedStatus, referendums]);

  const handleVote = async () => {
    if (!selectedReferendum || !selectedAccount) return;

    try {
      setIsVoting(true);
      await governanceService.vote(
        selectedReferendum.index,
        voteType,
        voteAmount,
        selectedAccount.address
      );
      setShowVoteDialog(false);
      void loadReferendums(); // Refresh the list
    } catch (err) {
      console.error('Failed to vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <LoadingSpinner className="w-8 h-8 mx-auto" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => void loadReferendums()}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (filteredReferendums.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-polkadot-pink focus:ring-polkadot-pink sm:text-sm"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Card className="p-6">
          <p className="text-center text-gray-600">No referendums found for the selected filter.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-polkadot-pink focus:ring-polkadot-pink sm:text-sm"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {filteredReferendums.map((referendum) => (
          <Card 
            key={referendum.index} 
            className="p-6 hover:shadow-lg transition-shadow duration-200 border-2 border-gray-200 hover:border-polkadot-pink/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-polkadot-pink bg-opacity-10 text-polkadot-pink">
                    #{referendum.index}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    referendum.status === 'ongoing' 
                      ? 'bg-green-100 text-green-800'
                      : referendum.status === 'approved'
                      ? 'bg-blue-100 text-blue-800'
                      : referendum.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {referendum.status.charAt(0).toUpperCase() + referendum.status.slice(1)}
                  </span>
                  <a 
                    href={`https://polkadot.polkassembly.io/referenda/${referendum.index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-polkadot-pink hover:text-polkadot-pink-dark transition-colors ml-auto"
                  >
                    View on Polkassembly →
                  </a>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{referendum.title}</h3>
                <p className="text-gray-600 mb-6">{referendum.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Track</p>
                    <p className="font-medium text-gray-900">{referendum.track}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Deposit</p>
                    <p className="font-medium text-gray-900">{referendum.deposit} DOT</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Proposer</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate" title={referendum.proposer}>
                        {referendum.proposer.slice(0, 8)}...{referendum.proposer.slice(-8)}
                      </p>
                      <a
                        href={`https://polkadot.polkassembly.io/user/${referendum.proposer}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-polkadot-pink hover:text-polkadot-pink-dark transition-colors"
                      >
                        View
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Submission Time</p>
                    <p className="font-medium text-gray-900">
                      {new Date(referendum.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Current Tally</h4>
                  <div className="space-y-4">
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs font-semibold inline-block text-green-800">
                            Ayes: {referendum.tally.ayes}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold inline-block text-red-800">
                            Nays: {referendum.tally.nays}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${(Number(referendum.tally.ayes) / (Number(referendum.tally.ayes) + Number(referendum.tally.nays))) * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {referendum.status === 'ongoing' && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => {
                        setSelectedReferendum(referendum);
                        setShowVoteDialog(true);
                      }}
                      className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white"
                    >
                      Vote
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote on Referendum #{selectedReferendum?.index}</DialogTitle>
            <DialogDescription>
              {selectedReferendum?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vote Type</label>
              <div className="flex gap-4">
                <Button
                  variant={voteType === 'aye' ? 'default' : 'outline'}
                  onClick={() => setVoteType('aye')}
                  className="flex-1"
                >
                  Aye
                </Button>
                <Button
                  variant={voteType === 'nay' ? 'default' : 'outline'}
                  onClick={() => setVoteType('nay')}
                  className="flex-1"
                >
                  Nay
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (DOT)</label>
              <Input
                type="number"
                value={voteAmount}
                onChange={(e) => setVoteAmount(e.target.value)}
                placeholder="Enter amount to vote"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conviction</label>
              <Select value={conviction} onValueChange={setConviction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conviction" />
                </SelectTrigger>
                <SelectContent>
                  {CONVICTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowVoteDialog(false)}
                disabled={isVoting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVote}
                disabled={isVoting || !voteAmount}
                className="bg-polkadot-pink hover:bg-polkadot-pink-dark text-white"
              >
                {isVoting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Vote'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 