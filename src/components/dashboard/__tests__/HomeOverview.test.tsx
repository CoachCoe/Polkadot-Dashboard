/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomeOverview } from '../HomeOverview';
import { homeService } from '@/services/homeService';
import { formatBalance } from '@polkadot/util';

// Set formatBalance defaults for Polkadot
formatBalance.setDefaults({ decimals: 10, unit: 'DOT' });

// Mock the homeService
jest.mock('@/services/homeService', () => ({
  homeService: {
    getHomeData: jest.fn(),
  },
}));

// Mock the Card component
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  )
}));

describe('HomeOverview', () => {
  const mockAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
  const mockHomeData = {
    totalValue: '235.0000',
    balances: [
      {
        chain: 'Polkadot',
        available: '100.0000',
        locked: '50.0000',
        reserved: '25.0000',
        total: '175.0000',
      },
    ],
    stakes: [
      {
        chain: 'Polkadot',
        validatorAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '50.0000',
        rewards: '5.0000',
        status: 'active',
      },
    ],
    governanceActivity: [
      {
        referendumId: '1',
        title: 'Test Referendum',
        chain: 'Polkadot',
        status: 'active',
        vote: 'aye',
      },
    ],
    transactions: [
      {
        hash: '0x123',
        type: 'Transfer',
        chain: 'Polkadot',
        amount: '10.0000',
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    // Mock a delayed response to ensure we can see the loading state
    (homeService.getHomeData as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve(mockHomeData), 100))
    );

    render(<HomeOverview address={mockAddress} />);
    
    // The loading state should be visible immediately
    expect(screen.getByText('Loading home data...')).toBeInTheDocument();
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    });
  });

  it('shows error state when data loading fails', async () => {
    const errorMessage = 'Failed to load data';
    (homeService.getHomeData as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(<HomeOverview address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText(`Error loading home data: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('shows no data state when homeData is null', async () => {
    (homeService.getHomeData as jest.Mock).mockResolvedValueOnce(null);

    render(<HomeOverview address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('No home data available')).toBeInTheDocument();
    });
  });

  it('displays total portfolio value', async () => {
    (homeService.getHomeData as jest.Mock).mockResolvedValueOnce(mockHomeData);
    
    render(<HomeOverview address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('0') && content.includes('DOT'))).toBeInTheDocument();
    });
  });

  it('displays chain balances', async () => {
    (homeService.getHomeData as jest.Mock).mockResolvedValueOnce(mockHomeData);
    
    render(<HomeOverview address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('Balance Breakdown')).toBeInTheDocument();
      expect(screen.getAllByText('Polkadot').length).toBeGreaterThan(0);
      expect(screen.getByText(/Available:/)).toHaveTextContent('0');
      expect(screen.getByText(/Locked:/)).toHaveTextContent('0');
      expect(screen.getByText(/Reserved:/)).toHaveTextContent('0');
      expect(screen.getByText(/Total:/)).toHaveTextContent('0');
    });
  });

  it('displays staking activity', async () => {
    (homeService.getHomeData as jest.Mock).mockResolvedValueOnce(mockHomeData);
    
    render(<HomeOverview address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('Staking Activity')).toBeInTheDocument();
      expect(screen.getByText(/Staked:/)).toHaveTextContent('0');
      expect(screen.getByText(/Rewards:/)).toHaveTextContent('0');
      expect(screen.getAllByText('active').length).toBeGreaterThan(0);
    });
  });

  it('displays governance activity', async () => {
    (homeService.getHomeData as jest.Mock).mockResolvedValueOnce(mockHomeData);
    
    render(<HomeOverview address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('Governance Activity')).toBeInTheDocument();
      expect(screen.getByText('Test Referendum')).toBeInTheDocument();
      expect(screen.getAllByText('active').length).toBeGreaterThan(0);
      expect(screen.getAllByText('aye').length).toBeGreaterThan(0);
    });
  });

  it('displays recent transactions', async () => {
    (homeService.getHomeData as jest.Mock).mockResolvedValueOnce(mockHomeData);
    
    render(<HomeOverview address={mockAddress} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      expect(screen.getByText('Transfer')).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getAllByText('completed').length).toBeGreaterThan(0);
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const updatedData = { ...mockHomeData, totalValue: '300.0000' };
    (homeService.getHomeData as jest.Mock)
      .mockResolvedValueOnce(mockHomeData)
      .mockResolvedValueOnce(updatedData);
    
    render(<HomeOverview address={mockAddress} />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(homeService.getHomeData).toHaveBeenCalledTimes(2);
      expect(screen.getByText((content) => content.includes('0') && content.includes('DOT'))).toBeInTheDocument();
    });
  });
}); 