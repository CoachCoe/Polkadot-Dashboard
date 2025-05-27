import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoriteReferenda } from '../FavoriteReferenda';
import { governanceService } from '@/services/governance';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/hooks/useToast');
jest.mock('@/services/governance');

describe('FavoriteReferenda', () => {
  const mockAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const mockReferenda = [
    {
      index: 1,
      title: 'Test Referendum 1',
      description: 'Description 1',
      track: 'root',
      status: 'ongoing',
      submittedAt: new Date().toISOString(),
      proposer: mockAddress,
      deposit: '1000 DOT',
      tally: {
        ayes: '1000',
        nays: '500',
        support: '750'
      },
      timeline: {
        created: Date.now() - 86400000,
        deciding: Date.now() - 43200000,
        confirming: null,
        completed: null
      }
    },
    {
      index: 2,
      title: 'Test Referendum 2',
      description: 'Description 2',
      track: 'general',
      status: 'ongoing',
      submittedAt: new Date().toISOString(),
      proposer: mockAddress,
      deposit: '500 DOT',
      tally: {
        ayes: '2000',
        nays: '1000',
        support: '1500'
      },
      timeline: {
        created: Date.now() - 172800000,
        deciding: Date.now() - 86400000,
        confirming: null,
        completed: null
      }
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
    (governanceService.getReferenda as jest.Mock).mockResolvedValue(mockReferenda);

    // Clear localStorage
    localStorage.clear();
  });

  it('renders loading state initially', async () => {
    render(<FavoriteReferenda />);
    expect(screen.getByText('Loading favorite referenda...')).toBeInTheDocument();
  });

  it('shows empty state when no favorites', async () => {
    render(<FavoriteReferenda />);

    await waitFor(() => {
      expect(screen.getByText('No favorite referenda yet. Star a referendum to track it here.')).toBeInTheDocument();
    });
  });

  it('allows adding and removing favorites', async () => {
    render(<FavoriteReferenda />);

    // Wait for referenda to load
    await waitFor(() => {
      expect(screen.queryByText('Loading favorite referenda...')).not.toBeInTheDocument();
    });

    // Add a favorite
    const starButtons = screen.getAllByText('☆');
    fireEvent.click(starButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Referendum 1')).toBeInTheDocument();
    });

    // Remove the favorite
    const filledStarButton = screen.getByText('★');
    fireEvent.click(filledStarButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Referendum 1')).not.toBeInTheDocument();
      expect(screen.getByText('No favorite referenda yet. Star a referendum to track it here.')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    const error = new Error('Failed to load referenda');
    (governanceService.getReferenda as jest.Mock).mockRejectedValue(error);

    render(<FavoriteReferenda />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load referenda')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows connect wallet message when no address', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });

    render(<FavoriteReferenda />);
    expect(screen.getByText('Please connect your wallet to track referenda.')).toBeInTheDocument();
  });

  it('persists favorites across sessions', async () => {
    const { unmount } = render(<FavoriteReferenda />);

    // Add a favorite
    await waitFor(() => {
      expect(screen.queryByText('Loading favorite referenda...')).not.toBeInTheDocument();
    });

    const starButtons = screen.getAllByText('☆');
    fireEvent.click(starButtons[0]);

    // Unmount and remount to simulate page refresh
    unmount();
    render(<FavoriteReferenda />);

    await waitFor(() => {
      expect(screen.getByText('Test Referendum 1')).toBeInTheDocument();
      expect(screen.getByText('★')).toBeInTheDocument();
    });
  });
}); 