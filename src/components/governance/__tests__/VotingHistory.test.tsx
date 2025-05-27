import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { VotingHistory } from '../VotingHistory';
import { governanceService } from '@/services/governance';

// Mock dependencies
jest.mock('@/services/governance');

describe('VotingHistory', () => {
  const mockAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const mockDelegations = [
    {
      target: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      track: 1,
      balance: '1000',
      timestamp: Date.now() - 86400000,
    },
    {
      target: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
      track: 2,
      balance: '500',
      timestamp: Date.now() - 43200000,
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock governanceService
    (governanceService.getDelegationHistory as jest.Mock).mockResolvedValue(mockDelegations);
  });

  it('renders loading state initially', () => {
    render(<VotingHistory address={mockAddress} />);
    expect(screen.getByText('Loading delegation history...')).toBeInTheDocument();
  });

  it('renders delegations after loading', async () => {
    render(<VotingHistory address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('Delegation Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Delegations')).toBeInTheDocument();
      expect(screen.getByText('Total Value Delegated')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total delegations count
      expect(screen.getByText('1500.00 DOT')).toBeInTheDocument(); // Total value
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Delegation History')).toBeInTheDocument();
      expect(screen.getByText(`Delegated to ${mockDelegations[0]!.target}`)).toBeInTheDocument();
      expect(screen.getByText(`Delegated to ${mockDelegations[1]!.target}`)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    const error = new Error('Failed to load delegations');
    (governanceService.getDelegationHistory as jest.Mock).mockRejectedValue(error);

    render(<VotingHistory address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading History')).toBeInTheDocument();
      expect(screen.getByText('Failed to load delegation history. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no delegations', async () => {
    (governanceService.getDelegationHistory as jest.Mock).mockResolvedValue([]);

    render(<VotingHistory address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('No delegation history found.')).toBeInTheDocument();
    });
  });

  it('shows loading state when empty address', () => {
    render(<VotingHistory address="" />);
    expect(screen.getByText('Loading delegation history...')).toBeInTheDocument();
  });
}); 