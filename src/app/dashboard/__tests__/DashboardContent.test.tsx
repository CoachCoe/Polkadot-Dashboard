import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardContent } from '../DashboardContent';

// Mock the wallet store
const mockUseWalletStore = jest.fn();
jest.mock('@/store/useWalletStore', () => ({
  useWalletStore: (selector: any) => mockUseWalletStore(selector)
}));

// Mock components
jest.mock('@/components/dashboard/HomeOverview', () => ({
  HomeOverview: () => <div data-testid="home-overview">Home Overview</div>
}));

describe('DashboardContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows welcome message when no wallet is connected', () => {
    // Mock no selected account
    mockUseWalletStore.mockImplementation(() => ({
      selectedAccount: null
    }));

    render(<DashboardContent />);

    // These will throw if not found
    screen.getByText('Welcome to Polkadot Hub');
    screen.getByText('Connect your wallet to view your home dashboard and manage your assets.');
  });

  it('shows home overview when wallet is connected', () => {
    // Mock selected account
    mockUseWalletStore.mockImplementation(() => ({
      selectedAccount: { address: '123' }
    }));

    render(<DashboardContent />);

    // This will throw if not found
    screen.getByTestId('home-overview');
  });
}); 