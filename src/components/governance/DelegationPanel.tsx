'use client';
import React, { useState } from 'react';
import { Track } from '@/services/governance';

interface DelegationPanelProps {
  onDelegate: (trackId: number, target: string, amount: string, conviction: number) => Promise<void>;
  tracks: Track[];
  isLoading: boolean;
}

const CONVICTION_OPTIONS = [
  { value: 0, label: '0.1x voting weight, no lockup' },
  { value: 1, label: '1x voting weight, locked for 1 day' },
  { value: 2, label: '2x voting weight, locked for 2 days' },
  { value: 3, label: '3x voting weight, locked for 4 days' },
  { value: 4, label: '4x voting weight, locked for 8 days' },
  { value: 5, label: '5x voting weight, locked for 16 days' },
  { value: 6, label: '6x voting weight, locked for 32 days' },
];

export function DelegationPanel({ onDelegate, tracks, isLoading }: DelegationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [target, setTarget] = useState('');
  const [amount, setAmount] = useState('');
  const [conviction, setConviction] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!target) {
      setError('Please enter a delegate address');
      return;
    }

    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    if (selectedTrackId === '') {
      setError('Please select a track');
      return;
    }

    try {
      await onDelegate(selectedTrackId, target, amount, conviction);
      setIsExpanded(false);
      setTarget('');
      setAmount('');
      setConviction(0);
      setSelectedTrackId('');
    } catch (err) {
      setError('Failed to delegate votes. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Delegate Votes</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-pink-600 hover:text-pink-700"
        >
          {isExpanded ? 'Cancel' : 'Delegate'}
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Track
            </label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              <option value="">Select a track</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name} - {track.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delegate Address
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter delegate address"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (DOT)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter amount to delegate"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conviction
            </label>
            <select
              value={conviction}
              onChange={(e) => setConviction(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              {CONVICTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Higher conviction means more voting power but longer lock-up periods
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Delegating...' : 'Confirm Delegation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 