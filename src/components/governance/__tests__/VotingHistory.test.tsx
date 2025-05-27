import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VotingHistory } from '../VotingHistory';
import { governanceService } from '@/services/governance';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/hooks/useToast');
jest.mock('@/services/governance');

describe('VotingHistory', () => {
  const mockAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const mockVotes = [
    {
      referendumIndex: 1,
      vote: 'aye',
      amount: '1000 DOT',
      timestamp: Date.now() - 86400000,
      status: 'completed',
      title: 'Test Referendum 1'
    },
    {
      referendumIndex: 2,
      vote: 'nay',
      amount: '500 DOT',
      timestamp: Date.now() - 43200000,
      status: 'active',
      title: 'Test Referendum 2'
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useSession
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { address: mockAddress } },
      status: 'authenticated'
    });

    // Mock useToast
    (useToast as jest.Mock).mockReturnValue({
      showToast: jest.fn()
    });

    // Mock governanceService
    (governanceService.getVotingHistory as jest.Mock).mockResolvedValue(mockVotes);
  });

  it('renders loading state initially', async () => {
    render(<VotingHistory />);
    expect(screen.getByText('Loading voting history...')).toBeInTheDocument();
  });

  it('renders votes after loading', async () => {
    render(<VotingHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Referendum 1')).toBeInTheDocument();
      expect(screen.getByText('Test Referendum 2')).toBeInTheDocument();
    });
  });

  it('filters votes by status', async () => {
    render(<VotingHistory />);

    await waitFor(() => {
      expect(screen.getByText('Test Referendum 1')).toBeInTheDocument();
    });

    // Click the "Active" filter
    fireEvent.click(screen.getByText('Active'));

    // Should only show active referendum
    expect(screen.queryByText('Test Referendum 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Referendum 2')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const error = new Error('Failed to load votes');
    (governanceService.getVotingHistory as jest.Mock).mockRejectedValue(error);

    render(<VotingHistory />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load voting history. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows connect wallet message when no address', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });

    render(<VotingHistory />);
    expect(screen.getByText('Please connect your wallet to view voting history.')).toBeInTheDocument();
  });

  it('shows empty state when no votes', async () => {
    (governanceService.getVotingHistory as jest.Mock).mockResolvedValue([]);

    render(<VotingHistory />);

    await waitFor(() => {
      expect(screen.getByText('No voting history found for this address.')).toBeInTheDocument();
    });
  });
}); 