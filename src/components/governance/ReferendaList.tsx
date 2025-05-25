import React from 'react';
import type { Referendum } from '@/services/governance';

interface ReferendaListProps {
  referenda: Referendum[];
  isLoading: boolean;
  selectedReferendum: number | null;
  voteAmount: string;
  onVoteAmountChange: (amount: string) => void;
  onVote: (referendumIndex: number, voteType: 'aye' | 'nay') => Promise<void>;
  onSelectReferendum: (index: number | null) => void;
}

export function ReferendaList({
  referenda,
  isLoading,
  selectedReferendum,
  voteAmount,
  onVoteAmountChange,
  onVote,
  onSelectReferendum
}: ReferendaListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading referenda...</p>
      </div>
    );
  }

  if (referenda.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No referenda found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {referenda.map((ref) => (
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
                  onChange={(e) => onVoteAmountChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter amount to vote with"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => onVote(ref.index, 'aye')}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Vote Aye
                </button>
                <button
                  onClick={() => onVote(ref.index, 'nay')}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Vote Nay
                </button>
                <button
                  onClick={() => onSelectReferendum(null)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSelectReferendum(ref.index)}
              className="w-full bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
              disabled={ref.status === 'Completed'}
            >
              {ref.status === 'Completed' ? 'Voting Ended' : 'Vote on Referendum'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
} 